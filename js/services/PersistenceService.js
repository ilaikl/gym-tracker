/**
 * PersistenceService - A wrapper around IndexedDB for CRUD operations.
 * (PLAN-001 | R5 | LLD-001)
 */
class PersistenceService {
    constructor(dbName = 'WorkoutTrackerDB', version = 1) {
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
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = key ? store.put(data, key) : store.put(data);
            request.onsuccess = () => resolve(request.result);
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
            request.onsuccess = () => resolve();
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
            // Settings is a single document, we can store it with a fixed key 'app_settings'
            // OR if LLD implies it's just the object itself, we need to decide.
            // LLD says "settings: (single document)".
            await this.save('settings', fullState.settings, 'current');
        }

        console.info('PersistenceService: All data replaced from imported state.');
    }
}

export const persistenceService = new PersistenceService();
