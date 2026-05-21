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
