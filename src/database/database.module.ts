import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

export const DatabaseModule = TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.user'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: true,
    })
})