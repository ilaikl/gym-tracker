import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { authService } from './AuthService.js';
import { persistenceService } from './PersistenceService.js';

class SyncService {
    constructor() {
        this.db = null;
        this.isSyncing = false;
    }

    init() {
        if (!authService.initialized) {
            console.warn('SyncService: AuthService not initialized. Delaying SyncService init.');
            return;
        }
        this.db = getFirestore(authService.app);

        // Listen for persistence changes to push to cloud
        window.addEventListener('persistence-changed', (event) => {
            this.handlePersistenceChange(event.detail);
        });

        window.addEventListener('persistence-deleted', (event) => {
            this.handlePersistenceDelete(event.detail);
        });

        // Listen for auth state changes to trigger initial sync
        window.addEventListener('auth-state-changed', (event) => {
            if (event.detail.user) {
                this.syncAll();
            }
        });
    }

    async handlePersistenceChange({ storeName, data, key }) {
        if (!authService.isAuthenticated()) return;

        const uid = authService.getCurrentUser().uid;
        const docId = key.toString();

        try {
            // Map store name to Firestore collection path
            const path = this.getFirestorePath(storeName, uid, docId);
            if (!path) return;

            await setDoc(doc(this.db, ...path), data);
            console.info(`SyncService: Pushed change to ${storeName}/${docId}`);
        } catch (error) {
            console.error(`SyncService: Failed to push change to ${storeName}/${docId}`, error);
        }
    }

    async handlePersistenceDelete({ storeName, id }) {
        if (!authService.isAuthenticated()) return;

        const uid = authService.getCurrentUser().uid;
        const docId = id.toString();

        try {
            const path = this.getFirestorePath(storeName, uid, docId);
            if (!path) return;

            await deleteDoc(doc(this.db, ...path));
            console.info(`SyncService: Pushed deletion to ${storeName}/${docId}`);
        } catch (error) {
            console.error(`SyncService: Failed to push deletion to ${storeName}/${docId}`, error);
        }
    }

    getFirestorePath(storeName, uid, docId) {
        // users/{uid}/program/default
        // users/{uid}/settings/current
        // users/{uid}/workoutLogs/{logId}
        // users/{uid}/nutritionLogs/{logDate}
        // users/{uid}/ingredients/{ingredientId}

        switch (storeName) {
            case 'program':
                return ['users', uid, 'program', docId];
            case 'settings':
                return ['users', uid, 'settings', docId];
            case 'workoutLogs':
                return ['users', uid, 'workoutLogs', docId];
            case 'nutritionLogs':
                return ['users', uid, 'nutritionLogs', docId];
            case 'ingredients':
                return ['users', uid, 'ingredients', docId];
            default:
                return null;
        }
    }

    async syncAll() {
        if (this.isSyncing || !authService.isAuthenticated()) return;
        this.isSyncing = true;
        console.info('SyncService: Starting full sync...');

        try {
            const uid = authService.getCurrentUser().uid;
            const stores = ['program', 'settings', 'workoutLogs', 'nutritionLogs', 'ingredients'];

            for (const storeName of stores) {
                await this.syncStore(storeName, uid);
            }

            console.info('SyncService: Full sync completed.');
        } catch (error) {
            console.error('SyncService: Full sync failed', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async syncStore(storeName, uid) {
        // 1. Get all local data
        const localData = await persistenceService.getAll(storeName);
        const localMap = new Map();

        // Settings and Program might be single objects or handled differently
        if (storeName === 'settings' || storeName === 'program') {
            // For these, we might need special handling since getAll might return an array if they were saved with keys
            // But usually they are handled by ID
            const items = await persistenceService.getAll(storeName);
            // Re-fetch to get keys if they are not in the object (though they should be for most)
            // For simplicity, let's assume they have IDs or we fetch by known IDs
            if (storeName === 'settings') {
                const settings = await persistenceService.getById('settings', 'current');
                if (settings) localMap.set('current', settings);
            } else if (storeName === 'program') {
                 // Program items have IDs like 'day-1', 'day-2'...
                 localData.forEach(item => localMap.set(item.id, item));
            }
        } else {
            localData.forEach(item => localMap.set(item.id, item));
        }

        // 2. Get all remote data
        const remoteSnap = await getDocs(collection(this.db, 'users', uid, storeName));
        const remoteMap = new Map();
        remoteSnap.forEach(doc => remoteMap.set(doc.id, doc.data()));

        // 3. Compare and Resolve (Last-Write-Wins)

        // Push local to remote if newer or missing
        for (const [id, localItem] of localMap) {
            const remoteItem = remoteMap.get(id);
            if (!remoteItem || (localItem.updatedAt > remoteItem.updatedAt)) {
                const path = this.getFirestorePath(storeName, uid, id);
                await setDoc(doc(this.db, ...path), localItem);
                console.info(`SyncService: Uploaded ${storeName}/${id}`);
            }
        }

        // Pull remote to local if newer or missing
        for (const [id, remoteItem] of remoteMap) {
            const localItem = localMap.get(id);
            if (!localItem || (remoteItem.updatedAt > localItem.updatedAt)) {
                // Use a special internal save that doesn't trigger a push back to avoid loops
                await this.internalLocalSave(storeName, remoteItem, id);
                console.info(`SyncService: Downloaded ${storeName}/${id}`);
            }
        }
    }

    async internalLocalSave(storeName, data, id) {
        // Temporarily remove listener to avoid feedback loop
        // Alternatively, add a flag to the event
        const store = await persistenceService.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = (storeName === 'settings') ? store.put(data, id) : store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const syncService = new SyncService();
