import { createRequire } from 'node:module';
import pino from 'pino';
import { config } from './env.js';

const require = createRequire(import.meta.url);

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

function resolveTransport() {
    if (!config.isDev) return undefined;
    try {
        // Only enable pretty transport if pino-pretty is actually installed.
        // In production / when devDeps are omitted, fall back to plain JSON logs.
        require.resolve('pino-pretty');
        return {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', singleLine: false },
        };
    } catch {
        return undefined;
    }
}

export const logger = pino({ ...baseOptions, transport: resolveTransport() });

export default logger;
