import { config } from '../../config/env.js';
import { LocalStorage } from './localStorage.js';

let instance;

export function getStorage() {
    if (!instance) {
        instance = new LocalStorage({ root: config.upload.dir });
    }
    return instance;
}

export async function initStorage() {
    const storage = getStorage();
    await storage.init();
    return storage;
}

export default getStorage;
