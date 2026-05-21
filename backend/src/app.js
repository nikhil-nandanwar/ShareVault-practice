import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

import { config } from './config/env.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { ApiError } from './utils/ApiError.js';

import v1Routes from './api/v1/routes/index.js';
import healthRoutes from './api/v1/routes/health.routes.js';

export function buildApp() {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', config.server.trustProxy);

    app.use(requestIdMiddleware);
    app.use(requestLoggerMiddleware);

    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false,
        }),
    );

    app.use(
        cors({
            origin(origin, cb) {
                if (!origin) return cb(null, true);
                if (config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
                    return cb(null, true);
                }
                return cb(ApiError.forbidden(`Origin ${origin} not allowed by CORS`));
            },
            methods: ['GET', 'POST', 'DELETE'],
            credentials: true,
            maxAge: 600,
        }),
    );

    app.use(compression());

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    app.use(mongoSanitize());
    app.use(hpp());

    app.use(globalRateLimiter);

    app.use('/', healthRoutes);
    app.use('/api/v1', v1Routes);
    app.use('/api', v1Routes);

    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
}

export default buildApp;
