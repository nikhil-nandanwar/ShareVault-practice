import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().integer().min(1).max(65535).default(5000),
    HOST: Joi.string().default('0.0.0.0'),

    MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
    MONGO_POOL_SIZE: Joi.number().integer().min(1).max(500).default(50),

    FRONTEND_URI: Joi.string().required(),

    LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),

    UPLOAD_DIR: Joi.string().default('uploads'),
    MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(102400).default(2048),
    MAX_FILES_PER_UPLOAD: Joi.number().integer().min(1).max(1000).default(50),
    MAX_TEXT_BYTES: Joi.number().integer().min(1).max(10 * 1024 * 1024).default(1024 * 1024),
    MAX_CHUNK_SIZE_MB: Joi.number().integer().min(1).max(100).default(8),
    CHUNK_SESSION_TTL_MIN: Joi.number().integer().min(1).max(720).default(30),

    CONTENT_TTL_SECONDS: Joi.number().integer().min(60).default(24 * 60 * 60),
    CLEANUP_INTERVAL_MS: Joi.number().integer().min(60_000).default(60 * 60 * 1000),

    RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60_000),
    RATE_LIMIT_MAX: Joi.number().integer().min(1).default(120),
    UPLOAD_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(20),

    TRUST_PROXY: Joi.string().default('loopback'),
    ADMIN_TOKEN: Joi.string().min(16).optional(),
}).unknown(true);

const { value, error } = schema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
});

if (error) {
    const details = error.details.map((d) => `  - ${d.message}`).join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n[config] Invalid environment configuration:\n${details}\n`);
    process.exit(1);
}

const corsOrigins = value.FRONTEND_URI
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = Object.freeze({
    env: value.NODE_ENV,
    isProd: value.NODE_ENV === 'production',
    isDev: value.NODE_ENV === 'development',
    isTest: value.NODE_ENV === 'test',

    server: {
        port: value.PORT,
        host: value.HOST,
        trustProxy: value.TRUST_PROXY,
    },

    db: {
        uri: value.MONGO_URI,
        poolSize: value.MONGO_POOL_SIZE,
    },

    cors: {
        origins: corsOrigins,
    },

    log: {
        level: value.LOG_LEVEL,
    },

    upload: {
        dir: value.UPLOAD_DIR,
        maxFileSizeBytes: value.MAX_FILE_SIZE_MB * 1024 * 1024,
        maxFiles: value.MAX_FILES_PER_UPLOAD,
        maxTextBytes: value.MAX_TEXT_BYTES,
        maxChunkSizeBytes: value.MAX_CHUNK_SIZE_MB * 1024 * 1024,
        chunkSessionTtlMs: value.CHUNK_SESSION_TTL_MIN * 60 * 1000,
    },

    content: {
        ttlSeconds: value.CONTENT_TTL_SECONDS,
        cleanupIntervalMs: value.CLEANUP_INTERVAL_MS,
    },

    rateLimit: {
        windowMs: value.RATE_LIMIT_WINDOW_MS,
        max: value.RATE_LIMIT_MAX,
        uploadMax: value.UPLOAD_RATE_LIMIT_MAX,
    },

    admin: {
        token: value.ADMIN_TOKEN || null,
    },
});

export default config;
