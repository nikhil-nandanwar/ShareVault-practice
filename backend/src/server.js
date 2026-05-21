import http from 'node:http';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initStorage } from './services/storage/index.js';
import { startCleanupJob, stopCleanupJob } from './jobs/cleanup.job.js';
import { buildApp } from './app.js';

const SHUTDOWN_TIMEOUT_MS = 15_000;
let server;
let shuttingDown = false;

async function start() {
    await initStorage();
    await connectDatabase();

    const app = buildApp();
    server = http.createServer(app);

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 70_000;
    server.requestTimeout = 5 * 60_000;

    await new Promise((resolve) => server.listen(config.server.port, config.server.host, resolve));
    logger.info(`Server listening on http://${config.server.host}:${config.server.port}`);

    startCleanupJob();
}

async function shutdown(signal, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);

    const timer = setTimeout(() => {
        logger.error('Shutdown timed out — forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
        stopCleanupJob();
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await disconnectDatabase();
        clearTimeout(timer);
        logger.info('Shutdown complete');
        process.exit(exitCode);
    } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
    }
}

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandledRejection');
    shutdown('unhandledRejection', 1);
});

start().catch((err) => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
