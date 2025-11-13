import type { ChatMessage, User } from "@sashay/api";

const DB_NAME = "chat_db";
const DB_VERSION = 1;

const USER_STORE = "users";
const CHAT_MESSAGE_STORE = "chat_messages";

let idbPromise: Promise<IDBDatabase> | null = null;

const openIdb = (): Promise<IDBDatabase> => {
    if (idbPromise) return idbPromise;

    idbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(USER_STORE)) {
                db.createObjectStore(USER_STORE, { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains(CHAT_MESSAGE_STORE)) {
                db.createObjectStore(CHAT_MESSAGE_STORE, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return idbPromise;
};

export const addChatMessage = async (message: ChatMessage) => {
    const idb = await openIdb();
    const tx = idb.transaction(CHAT_MESSAGE_STORE, "readwrite");
    const store = tx.objectStore(CHAT_MESSAGE_STORE);
    const req = store.put(message);

    return new Promise<void>((resolve, reject) => {
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

export const getAllChatMessages = async (): Promise<ChatMessage[]> => {
    const idb = await openIdb();
    const tx = idb.transaction(CHAT_MESSAGE_STORE, "readonly");
    const store = tx.objectStore(CHAT_MESSAGE_STORE);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveChatMessages = async (chatMessages: ChatMessage[]) => {
    const db = await openIdb();
    const tx = db.transaction(CHAT_MESSAGE_STORE, "readwrite");
    const store = tx.objectStore(CHAT_MESSAGE_STORE);

    for (const msg of chatMessages) {
        store.put(msg);
    }

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

export const saveUsers = async (users: User[]) => {
    const db = await openIdb();
    const tx = db.transaction(USER_STORE, "readwrite");
    const store = tx.objectStore(USER_STORE);

    for (const user of users) {
        store.put(user);
    }

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
};

export async function getAllUsers(): Promise<User[]> {
    const db = await openIdb();
    const tx = db.transaction(USER_STORE, "readonly");
    const store = tx.objectStore(USER_STORE);

    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
