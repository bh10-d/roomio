import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { UserSession } from '../entities/user-session.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS CLIENT') private readonly redis: Redis,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  private getIp(request: any): string {
    const xff = request.headers['x-forwarded-for'];
    if (Array.isArray(xff) && xff.length > 0) {
      return xff[0];
    }

    if (typeof xff === 'string' && xff.length > 0) {
      return xff.split(',')[0].trim();
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  private getCookieValue(request: any, cookieName: string): string | null {
    const rawCookieHeader = request.headers.cookie;

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // When handler/class has @Public(), skip JWT validation for this request.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // For all non-public routes, enforce Bearer access token validation.
    const request = context.switchToHttp().getRequest();
    const authHeader = String(request.headers.authorization || '');
    const token = authHeader
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : null;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const secret = this.configService.get<string>('auth.jwtSecret');

    if (!secret) {
      throw new UnauthorizedException('Auth config invalid');
    }

    let payload: JwtPayload & { exp?: number };

    try {
      payload = await this.JwtService.verifyAsync<
        JwtPayload & { exp?: number }
      >(token, { secret });
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }

    const blacklisted = await this.redis.get(`blacklist:access:${payload.jti}`);

    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const cacheKey = 'session:' + payload.sid;
    const cached = await this.redis.get(cacheKey);

    let session: UserSession | null = null;
    if (cached) {
      session = JSON.parse(cached) as UserSession;
    } else {
      session = await this.userSessionRepository.findOne({
        where: { id: payload.sid },
      });
    }

    if (session) {
      const ttlSec = Math.max(
        1,
        Math.floor(
          (new Date(session.expires_at).getTime() - Date.now()) / 1000,
        ),
      );
      await this.redis.set(cacheKey, JSON.stringify(session), 'EX', ttlSec);
    }

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revoked_at) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has expired');
    }

    const activeJtiKey = 'session_active_jti:' + payload.sid;
    const activeJti = await this.redis.get(activeJtiKey);
    // If refresh already rotated this session, old access tokens must be rejected.
    if (activeJti && activeJti !== payload.jti) {
      throw new UnauthorizedException('Access token has been rotated');
    }

    if (!activeJti) {
      const ttlSec = Math.max(
        1,
        Math.floor(
          (new Date(session.expires_at).getTime() - Date.now()) / 1000,
        ),
      );
      await this.redis.set(activeJtiKey, payload.jti, 'EX', ttlSec);
    }

    const headerDeviceId = String(request.headers['x-device-id'] || '');
    const cookieDeviceId =
      this.getCookieValue(request, 'roomio_device_id') || '';
    const resolvedDeviceId = cookieDeviceId || headerDeviceId;
    const userAgent = String(request.headers['user-agent'] || '');
    const ip = this.getIp(request);

    if (resolvedDeviceId && resolvedDeviceId !== session.device_id) {
      throw new UnauthorizedException('Invalid device');
    }

    if (userAgent !== session.user_agent) {
      throw new UnauthorizedException('Invalid user agent');
    }

    // NOTE: IP check removed from guard flow to avoid false 401s when user changes network. Device ID binding is sufficient.
    // Update IP on every heartbeat/refresh to track latest user location for audit, but don't fail auth if it changes.
    // if (ip !== session.ip_address) {
    //   throw new UnauthorizedException('Invalid IP address');
    // }

    request.user = payload;
    request.session = session;

    return true;
  }
}
