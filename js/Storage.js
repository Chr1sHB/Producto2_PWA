export class StorageManager {
    constructor() {
        this.dbName = 'RectaEnteraDB';
        this.storeName = 'quiz_cache';
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    }

    async saveQuestions(questions) {
        const db = await this.open();
        return new Promise((resolve) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put(questions, 'latest');
            tx.oncomplete = () => resolve(true);
        });
    }

    async getQuestions() {
        const db = await this.open();
        return new Promise((resolve) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const req = tx.objectStore(this.storeName).get('latest');
            req.onsuccess = (e) => resolve(e.target.result || []);
        });
    }
}