/**
 * PersistenceService - A wrapper around IndexedDB for CRUD operations.
 * (PLAN-001 | R5 | LLD-001)
 */
class PersistenceService {
    constructor(dbName = 'WorkoutTrackerDB', version = 2) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve, reject) => {
            console.info('PersistenceService: Opening IndexedDB...', this.dbName, this.version);
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                console.info('PersistenceService: Upgrade needed.');
                const db = event.target.result;

                if (!db.objectStoreNames.contains('program')) {
                    db.createObjectStore('program', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('workoutLogs')) {
                    const logStore = db.createObjectStore('workoutLogs', { keyPath: 'id' });
                    logStore.createIndex('date', 'date', { unique: false });
                    logStore.createIndex('templateExerciseId', 'templateExerciseId', { unique: false });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }

                // Phase 11: Nutrition Tracking
                if (!db.objectStoreNames.contains('nutritionLogs')) {
                    const nutritionStore = db.createObjectStore('nutritionLogs', { keyPath: 'id' });
                    nutritionStore.createIndex('date', 'date', { unique: true });
                }

                if (!db.objectStoreNames.contains('ingredients')) {
                    db.createObjectStore('ingredients', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.info('PersistenceService: IndexedDB initialized successfully.');
                this._initPromise = null;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('PersistenceService: Error initializing IndexedDB', event.target.error);
                this._initPromise = null;
                reject(event.target.error);
            };

            request.onblocked = () => {
                console.warn('PersistenceService: IndexedDB open blocked. Please close other tabs.');
            };
        });

        return this._initPromise;
    }

    async getStore(storeName, mode = 'readonly') {
        if (!this.db) {
            console.warn(`PersistenceService: db not initialized when getting store "${storeName}". Re-initializing...`);
            await this.init();
        }
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async save(storeName, data, key) {
        // Ensure updatedAt is always set for sync
        if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
            data.updatedAt = new Date().toISOString();
        }

        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = key ? store.put(data, key) : store.put(data);
            request.onsuccess = () => {
                // Dispatch event for SyncService to pick up
                const event = new CustomEvent('persistence-changed', {
                    detail: { storeName, data, key: key || request.result }
                });
                window.dispatchEvent(event);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                // Dispatch event for SyncService to pick up (tombstone)
                const event = new CustomEvent('persistence-deleted', {
                    detail: { storeName, id }
                });
                window.dispatchEvent(event);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearStore(storeName) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Replaces the entire application state. Used for JSON import.
     */
    async replaceAll(fullState) {
        await this.init();

        // Clear all stores
        await this.clearStore('program');
        await this.clearStore('workoutLogs');
        await this.clearStore('settings');
        await this.clearStore('nutritionLogs');
        await this.clearStore('ingredients');

        // Populate stores
        if (fullState.program) {
            await this.save('program', fullState.program);
        }

        if (fullState.workoutLogs && Array.isArray(fullState.workoutLogs)) {
            for (const log of fullState.workoutLogs) {
                await this.save('workoutLogs', log);
            }
        }

        if (fullState.settings) {
            await this.save('settings', fullState.settings, 'current');
        }

        if (fullState.nutritionLogs && Array.isArray(fullState.nutritionLogs)) {
            for (const log of fullState.nutritionLogs) {
                await this.save('nutritionLogs', log);
            }
        }

        if (fullState.ingredients && Array.isArray(fullState.ingredients)) {
            for (const ing of fullState.ingredients) {
                await this.save('ingredients', ing);
            }
        }

        console.info('PersistenceService: All data replaced from imported state (including Nutrition).');
    }

    /**
     * Merges imported logs into the workoutLogs store.
     */
    async mergeLogs(logs) {
        await this.init();
        let addedCount = 0;
        let updatedCount = 0;

        for (const log of logs) {
            const existing = await this.getById('workoutLogs', log.id);
            if (!existing) {
                await this.save('workoutLogs', log);
                addedCount++;
            } else {
                // Update if the imported log is newer
                if (new Date(log.updatedAt) > new Date(existing.updatedAt)) {
                    await this.save('workoutLogs', log);
                    updatedCount++;
                }
            }
        }
        console.info(`PersistenceService: Merged logs. Added: ${addedCount}, Updated: ${updatedCount}`);
        return { addedCount, updatedCount };
    }
}

export const persistenceService = new PersistenceService();
