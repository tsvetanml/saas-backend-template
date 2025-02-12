import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
const LokiTransport = require('winston-loki');

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(), // Show logs in the console
        new winston.transports.File({ filename: 'logs/app.log' }), // Save logs in a file
        new LokiTransport({
          host: 'http://localhost:3100',
          labels: { app: 'saas-backend' },
          json: true,
          batching: true,
          interval: 5, // 5 seconds
        }),
      ],
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error({ message, trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
