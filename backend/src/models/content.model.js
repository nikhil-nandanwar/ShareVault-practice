import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { CONTENT_TYPES } from '../utils/constants.js';

const fileSchema = new mongoose.Schema(
    {
        storageKey: { type: String, required: true },
        filename: { type: String, required: true, maxlength: 512 },
        // Original path inside an uploaded folder (e.g. "docs/specs/intro.md").
        // Empty string for plain file uploads.
        relativePath: { type: String, default: '', maxlength: 1024 },
        size: { type: Number, required: true, min: 0 },
        mimeType: { type: String, default: 'application/octet-stream' },
    },
    { _id: false },
);

const contentSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, index: true, length: 4 },
        type: { type: String, enum: Object.values(CONTENT_TYPES), required: true },
        content: { type: String, default: null },
        files: { type: [fileSchema], default: undefined },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: config.content.ttlSeconds,
        },
    },
    {
        versionKey: false,
        minimize: true,
        toJSON: {
            virtuals: false,
            transform: (_doc, ret) => {
                delete ret._id;
                if (ret.files) {
                    ret.files = ret.files.map((f) => ({
                        filename: f.filename,
                        relativePath: f.relativePath || '',
                        size: f.size,
                        mimeType: f.mimeType,
                    }));
                }
                return ret;
            },
        },
    },
);

export const Content = mongoose.model('Content', contentSchema);

export default Content;
