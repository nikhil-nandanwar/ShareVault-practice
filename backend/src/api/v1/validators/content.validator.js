import Joi from 'joi';
import { config } from '../../../config/env.js';

export const textUploadBody = Joi.object({
    content: Joi.string().min(1).max(config.upload.maxTextBytes).required(),
});

export const codeParam = Joi.object({
    code: Joi.string().length(4).pattern(/^\d{4}$/).required(),
});

export const downloadParams = Joi.object({
    code: Joi.string().length(4).pattern(/^\d{4}$/).required(),
    fileIndex: Joi.number().integer().min(0).max(99).required(),
});

export const initChunkSessionBody = Joi.object({
    files: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().min(1).max(512).required(),
                relativePath: Joi.string().allow('').max(1024).default(''),
                size: Joi.number().integer().min(0).max(config.upload.maxFileSizeBytes).required(),
                totalChunks: Joi.number().integer().min(1).max(100000).required(),
                mimeType: Joi.string().max(255).default('application/octet-stream'),
            }),
        )
        .min(1)
        .max(config.upload.maxFiles)
        .required(),
});

export const sessionParams = Joi.object({
    sessionId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const chunkParams = Joi.object({
    sessionId: Joi.string().guid({ version: ['uuidv4'] }).required(),
    fileId: Joi.string().guid({ version: ['uuidv4'] }).required(),
    chunkIndex: Joi.number().integer().min(0).max(99999).required(),
});
