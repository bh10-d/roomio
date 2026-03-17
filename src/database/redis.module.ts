import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS CLIENT',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new Redis({
                    host: config.get('redis.host'),
                    port: config.get('redis.port'),
                    password: config.get('redis.password'),
                });
            },
        },
    ],
    exports: ['REDIS CLIENT'],
})

export class RedisModule {}