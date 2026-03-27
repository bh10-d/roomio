import { Repository } from 'typeorm';
import { UserSession } from './entities/user-session.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from 'src/common/enums/user-status.enum';

type ClientMeta = {
  ip: string;
  userAgent: string;
};

type RefreshPayload = {
  refresh_token: string;
  device_id: string;
};

type LogoutPayload = {
  refresh_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserSession)
    private UserSessionRepository: Repository<UserSession>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS CLIENT') private readonly redis: Redis,
  ) {}

  private get accessTokenTtlSec(): number {
    return this.configService.get<number>('auth.accessTokenTtlSec') || 900;
  }

  private get refreshTokenTtlSec(): number {
    return this.configService.get<number>('auth.refreshTokenTtlSec') || 2592000;
  }

  private get loginWindowSec(): number {
    return this.configService.get<number>('auth.loginWindowSec') || 60;
  }

  private get lockMinutes(): number {
    return this.configService.get<number>('auth.lockMinutes') || 15;
  }

  private get loginMaxAttempts(): number {
    return this.configService.get<number>('auth.loginMaxAttempts') || 5;
  }

  private sanitizeUser(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private async issueAccessToken(payload: JwtPayload): Promise<string> {
    const secret = this.configService.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('Auth config invalid');
    }

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: this.accessTokenTtlSec,
    });
  }

  private async assertLoginRateLimit(email: string): Promise<void> {
    const key = 'rate_limit:login:' + email.toLowerCase();

    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, this.loginWindowSec);
    }

    if (count > this.loginMaxAttempts) {
      throw new HttpException(
        'Too many login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async cacheSession(session: UserSession): Promise<void> {
    const ttlSec = Math.max(
      1,
      Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000),
    );
    await this.redis.set(
      'session:' + session.id,
      JSON.stringify(session),
      'EX',
      ttlSec,
    );
  }

  private async setActiveAccessJti(
    sessionId: string,
    jti: string,
  ): Promise<void> {
    // Bind one active access token per session so refresh invalidates previous access tokens immediately.
    await this.redis.set(
      'session_active_jti:' + sessionId,
      jti,
      'EX',
      this.refreshTokenTtlSec,
    );
  }

  private async touchPresence(userId: string): Promise<void> {
    await this.redis.set(
      'presence:user:' + userId,
      JSON.stringify({ last_seen_at: new Date().toISOString() }),
      'EX',
      60,
    );
  }

  async login(data: LoginDto, meta: ClientMeta) {
    await this.assertLoginRateLimit(data.email);

    const user = await this.userRepository.findOne({
      where: { email: data.email.toLocaleLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('User is blocked');
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('User is pending');
    }

    if (
      user.locked_until &&
      new Date(user.locked_until).getTime() > Date.now()
    ) {
      throw new ForbiddenException('User temporarily locked');
    }

    const matched = await bcrypt.compare(data.password, user.password);

    if (!matched) {
      const nextCount = (user.failed_login_count || 0) + 1;
      const lockedUntil =
        nextCount >= this.loginMaxAttempts
          ? new Date(Date.now() + this.lockMinutes * 60 * 1000)
          : undefined;

      await this.userRepository.update(
        { id: user.id },
        {
          failed_login_count: nextCount,
          locked_until: lockedUntil,
          last_seen_at: new Date(),
        },
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(
      { id: user.id },
      {
        failed_login_count: 0,
        locked_until: undefined,
        last_login_at: new Date(),
        last_seen_at: new Date(),
      },
    );

    const refreshToken = this.generateRefreshToken();
    const refreshHash = this.hashToken(refreshToken);
    const resolvedDeviceId = randomUUID();

    const session = this.UserSessionRepository.create({
      user_id: user.id,
      refresh_token_hash: refreshHash,
      device_id: resolvedDeviceId,
      user_agent: meta.userAgent,
      ip_address: meta.ip,
      expires_at: new Date(Date.now() + this.refreshTokenTtlSec * 1000),
      last_used_at: new Date(),
      revoked_at: null,
    });

    const savedSession = await this.UserSessionRepository.save(session);

    const payload: JwtPayload = {
      sub: user.id,
      sid: savedSession.id,
      role: user.role,
      jti: randomUUID(),
    };

    const accessToken = await this.issueAccessToken(payload);

    await this.cacheSession(savedSession);
    await this.setActiveAccessJti(savedSession.id, payload.jti);
    await this.touchPresence(user.id);

    return {
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        device_id: resolvedDeviceId,
        access_token_expires_in: this.accessTokenTtlSec,
        refresh_token_expires_in: this.refreshTokenTtlSec,
        user: this.sanitizeUser(user),
      },
    };
  }

  async refresh(data: RefreshPayload, meta: ClientMeta) {
    if (!data.refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const hashed = this.hashToken(data.refresh_token);

    const session = await this.UserSessionRepository.findOne({
      where: { refresh_token_hash: hashed },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revoked_at) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (session.device_id !== data.device_id) {
      throw new UnauthorizedException('Invalid device');
    }

    if (session.user_agent !== meta.userAgent) {
      throw new UnauthorizedException('Invalid user agent');
    }

    // NOTE: IP check removed from refresh flow to avoid false 401s when user changes network (WiFi↔4G, VPN, proxy, NAT).
    // Device + user-agent + session expiry provide sufficient security. IP binding can be added as optional strict mode if needed.
    // if (session.ip_address !== meta.ip) {
    //   throw new UnauthorizedException('Invalid IP address');
    // }

    const user = await this.userRepository.findOne({
      where: { id: session.user_id },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const nextRefreshToken = this.generateRefreshToken();
    session.refresh_token_hash = this.hashToken(nextRefreshToken);
    // Refresh rotation: new refresh token + new access jti for the same session.
    session.last_used_at = new Date();
    session.expires_at = new Date(Date.now() + this.refreshTokenTtlSec * 1000);
    session.user_agent = meta.userAgent;
    session.ip_address = meta.ip;

    const updatedSession = await this.UserSessionRepository.save(session);

    const payload: JwtPayload = {
      sub: user.id,
      sid: updatedSession.id,
      role: user.role,
      jti: randomUUID(),
    };

    const accessToken = await this.issueAccessToken(payload);

    await this.cacheSession(updatedSession);
    await this.setActiveAccessJti(updatedSession.id, payload.jti);
    await this.touchPresence(user.id);

    return {
      data: {
        access_token: accessToken,
        refresh_token: nextRefreshToken,
        access_token_expires_in: this.accessTokenTtlSec,
        refresh_token_expires_in: this.refreshTokenTtlSec,
      },
    };
  }

  async logout(accessToken: string | null, data: LogoutPayload) {
    if (!data.refresh_token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const hashed = this.hashToken(data.refresh_token);

    const session = await this.UserSessionRepository.findOne({
      where: { refresh_token_hash: hashed },
    });

    if (session) {
      session.revoked_at = new Date();
      await this.UserSessionRepository.save(session);
      await this.redis.del('session:' + session.id);
      await this.redis.del('session_active_jti:' + session.id);
    }

    if (accessToken) {
      try {
        const secret = this.configService.get<string>('auth.jwtSecret');
        if (secret) {
          const decoded = await this.jwtService.verifyAsync<
            JwtPayload & { exp: number }
          >(accessToken, { secret });
          const ttlSec = Math.max(
            1,
            decoded.exp - Math.floor(Date.now() / 1000),
          );
          await this.redis.set(
            'blacklist:access:' + decoded.jti,
            '1',
            'EX',
            ttlSec,
          );
        }
      } catch {
        //ignore invalid token
      }
    }

    return {
      message: 'Logout successful',
    };
  }

  async logoutByRefreshToken(refreshToken: string) {
    // Cookie-only logout entrypoint: revoke by refresh token without requiring access token header.
    return this.logout(null, { refresh_token: refreshToken });
  }

  async logoutAll(userId: string, accessToken: string | null) {
    const sessions = await this.UserSessionRepository.find({
      where: { user_id: userId },
    });

    const now = new Date();
    for (const session of sessions) {
      if (!session.revoked_at) {
        session.revoked_at = now;
      }
      await this.redis.del('session:' + session.id);
      await this.redis.del('session_active_jti:' + session.id);
    }

    if (sessions.length > 0) {
      await this.UserSessionRepository.save(sessions);
    }

    if (accessToken) {
      try {
        const secret = this.configService.get<string>('auth.jwtSecret');
        if (secret) {
          const decoded = await this.jwtService.verifyAsync<
            JwtPayload & { exp: number }
          >(accessToken, { secret });
          const ttlSec = Math.max(
            1,
            decoded.exp - Math.floor(Date.now() / 1000),
          );
          await this.redis.set(
            'blacklist:access:' + decoded.jti,
            '1',
            'EX',
            ttlSec,
          );
        }
      } catch {
        // ignore invalid token
      }
    }

    return {
      message: 'Logout all successful',
    };
  }

  async logoutAllByRefreshToken(refreshToken: string) {
    // Resolve current session from refresh token hash, then revoke every session of that user.
    const hashed = this.hashToken(refreshToken);
    const session = await this.UserSessionRepository.findOne({
      where: { refresh_token_hash: hashed },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.logoutAll(session.user_id, null);
  }

  async heartbeat(userId: string) {
    await this.userRepository.update(
      { id: userId },
      { last_seen_at: new Date() },
    );
    await this.touchPresence(userId);

    return {
      message: 'Heartbeat successful',
    };
  }
}
