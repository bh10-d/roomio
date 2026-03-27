import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private readonly refreshCookieName = 'roomio_refresh_token';
  private readonly deviceCookieName = 'roomio_device_id';

  private get refreshCookieMaxAgeMs(): number {
    const ttlSec =
      this.configService.get<number>('auth.refreshTokenTtlSec') || 2592000;
    return ttlSec * 1000;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(this.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.refreshCookieMaxAgeMs,
      path: '/api/v1/auth',
    });
  }

  private setDeviceIdCookie(res: Response, deviceId: string) {
    res.cookie(this.deviceCookieName, deviceId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.refreshCookieMaxAgeMs,
      path: '/api/v1',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private clearDeviceIdCookie(res: Response) {
    res.clearCookie(this.deviceCookieName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1',
    });
  }

  private getCookieValue(req: Request, cookieName: string): string | null {
    const rawCookieHeader = req.headers.cookie;

    if (!rawCookieHeader) {
      return null;
    }

    const cookies = rawCookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name === cookieName) {
        const value = valueParts.join('=');
        return value ? decodeURIComponent(value) : null;
      }
    }

    return null;
  }

  private getIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    if (Array.isArray(xff) && xff.length > 0) {
      return xff[0];
    }
    if (typeof xff === 'string' && xff.length > 0) {
      return xff.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = String(req.headers['user-agent'] || '');
    if (!userAgent) {
      throw new UnauthorizedException('Missing user-agent');
    }

    const result = await this.authService.login(body, {
      ip: this.getIp(req),
      userAgent,
    });

    this.setRefreshTokenCookie(res, result.data.refresh_token);
    this.setDeviceIdCookie(res, result.data.device_id);

    const { refresh_token, ...safeData } = result.data;
    return { data: safeData };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = String(req.headers['user-agent'] || '');
    if (!userAgent) {
      throw new UnauthorizedException('Missing user-agent');
    }

    // Refresh is cookie-only to avoid sending refresh token/device id in request payloads.
    const refreshToken = this.getCookieValue(req, this.refreshCookieName);
    const deviceId = this.getCookieValue(req, this.deviceCookieName);

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    if (!deviceId) {
      throw new UnauthorizedException('Missing device id');
    }

    const result = await this.authService.refresh(
      {
        refresh_token: refreshToken,
        device_id: deviceId,
      },
      {
        ip: this.getIp(req),
        userAgent,
      },
    );

    this.setRefreshTokenCookie(res, result.data.refresh_token);

    const { refresh_token, ...safeData } = result.data;
    return { data: safeData };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Logout is cookie-only: revoke current session via refresh-token cookie, no manual token payload.
    const refreshToken = this.getCookieValue(req, this.refreshCookieName);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.logoutByRefreshToken(refreshToken);
    this.clearRefreshTokenCookie(res);
    this.clearDeviceIdCookie(res);

    return result;
  }

  @Post('logout-all')
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Logout-all is driven by refresh-token cookie so FE does not need to send tokens manually.
    const refreshToken = this.getCookieValue(req, this.refreshCookieName);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.logoutAllByRefreshToken(refreshToken);
    this.clearRefreshTokenCookie(res);
    this.clearDeviceIdCookie(res);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('heartbeat')
  heartbeat(@Req() req: any) {
    return this.authService.heartbeat(req.user.sub);
  }
}
