import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);
mongoose.set('autoIndex', !config.isProd);

let isConnected = false;

export async function connectDatabase() {
    if (isConnected) return mongoose.connection;

    mongoose.connection.on('connected', () => {
        isConnected = true;
        logger.info('MongoDB connected');
    });
    mongoose.connection.on('disconnected', () => {
        isConnected = false;
        logger.warn('MongoDB disconnected');
    });
    mongoose.connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB connection error');
    });

    await mongoose.connect(config.db.uri, {
        maxPoolSize: config.db.poolSize,
        minPoolSize: Math.min(5, config.db.poolSize),
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
        autoIndex: !config.isProd,
    });

    if (config.isProd) {
        try {
            await mongoose.connection.syncIndexes();
        } catch (err) {
            logger.error({ err }, 'Index sync failed');
        }
    }

    return mongoose.connection;
}

export async function disconnectDatabase() {
    if (!isConnected) return;
    await mongoose.disconnect();
}

export function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}
