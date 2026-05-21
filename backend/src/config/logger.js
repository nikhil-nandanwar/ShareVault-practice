import pino from 'pino';
import { config } from './env.js';

const baseOptions = {
    level: config.log.level,
    base: { service: 'sharevault-backend', env: config.env },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-admin-token"]',
            '*.password',
            '*.token',
        ],
        remove: true,
    },
};

const transport = config.isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', singleLine: false },
    }
    : undefined;

export const logger = pino({ ...baseOptions, transport });

export default logger;
