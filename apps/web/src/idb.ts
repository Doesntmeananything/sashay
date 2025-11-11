import type { ChatMessage } from "../../api/src/main";

const DB_NAME = "chat_db";
const STORE_NAME = "messages";

let idbPromise: Promise<IDBDatabase> | null = null;

const openIdb = (): Promise<IDBDatabase> => {
    if (idbPromise) return idbPromise;

    idbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return idbPromise;
};

const addChatMessage = async (message: ChatMessage) => {
    const idb = await openIdb();
    const tx = idb.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(message);

    return new Promise<void>((resolve, reject) => {
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

const getAllChatMessages = async (): Promise<ChatMessage[]> => {
    const idb = await openIdb();
    const tx = idb.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const idb = {
    addChatMessage,
    getAllChatMessages,
};
