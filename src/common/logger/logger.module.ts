import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const LoggerModule = WinstonModule.forRoot({
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
