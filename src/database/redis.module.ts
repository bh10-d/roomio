import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const logger = new Logger('RedisModule');

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS CLIENT',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const client = new Redis({
                    host: config.get('redis.host'),
                    port: config.get('redis.port'),
                    password: config.get('redis.password') || undefined,
                });

                client.on('error', (error) => {
                    logger.error(`Redis connection error: ${error.message}`);
                });

                return client;
            },
        },
    ],
    exports: ['REDIS CLIENT'],
})

export class RedisModule {}