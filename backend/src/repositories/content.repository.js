import { Content } from '../models/content.model.js';
import { config } from '../config/env.js';

export const contentRepository = {
    async create(doc) {
        return Content.create(doc);
    },

    async findByCode(code) {
        return Content.findOne({ code }).lean();
    },

    async existsByCode(code) {
        return Content.exists({ code });
    },

    async deleteByCode(code) {
        return Content.findOneAndDelete({ code }).lean();
    },

    async deleteAll() {
        return Content.deleteMany({});
    },

    async findExpiredBatch(limit = 500) {
        const cutoff = new Date(Date.now() - config.content.ttlSeconds * 1000);
        return Content.find({ createdAt: { $lt: cutoff } })
            .limit(limit)
            .lean();
    },

    async deleteByIds(ids) {
        if (!ids.length) return { deletedCount: 0 };
        return Content.deleteMany({ _id: { $in: ids } });
    },
};

export default contentRepository;
