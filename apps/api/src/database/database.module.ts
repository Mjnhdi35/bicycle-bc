import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const databaseHost = configService.get<string>('DATABASE_HOST');
                const databasePort = configService.get<string>('DATABASE_PORT');
                const databaseUser = configService.get<string>('DATABASE_USER');
                const databasePassword = configService.get<string>('DATABASE_PASSWORD');
                const databaseName = configService.get<string>('DATABASE_NAME');
                const nodeEnv = configService.get<string>('NODE_ENV');

                if (!databaseHost) {
                    throw new Error('DATABASE_HOST environment variable is required');
                }
                if (!databasePort) {
                    throw new Error('DATABASE_PORT environment variable is required');
                }
                if (!databaseUser) {
                    throw new Error('DATABASE_USER environment variable is required');
                }
                if (!databasePassword) {
                    throw new Error('DATABASE_PASSWORD environment variable is required');
                }
                if (!databaseName) {
                    throw new Error('DATABASE_NAME environment variable is required');
                }
                if (!nodeEnv) {
                    throw new Error('NODE_ENV environment variable is required');
                }

                return {
                    type: 'postgres',
                    host: databaseHost,
                    port: parseInt(databasePort, 10),
                    username: databaseUser,
                    password: databasePassword,
                    database: databaseName,
                    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                    synchronize: nodeEnv !== 'production', // Auto sync schema in dev
                    logging: nodeEnv === 'development',
                };
            },
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule { }

