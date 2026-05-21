import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';

export const requestLoggerMiddleware = pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel(req, res, err) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
                remote: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            };
        },
        res(res) {
            return { statusCode: res.statusCode };
        },
    },
});

export default requestLoggerMiddleware;
