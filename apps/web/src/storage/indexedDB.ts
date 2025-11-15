import { openDB, type DBSchema } from "idb";

import type { ChatMessageEntity, UserEntity } from "@sashay/api";

const DB_NAME = "chat_db";
const DB_VERSION = 1;

const USER_STORE = "users";
const CHAT_MESSAGE_STORE = "chat_messages";

interface ChatDB extends DBSchema {
    users: {
        key: string;
        value: UserEntity;
    };
    chat_messages: {
        key: string;
        value: ChatMessageEntity;
    };
}

const dbPromise = openDB<ChatDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(USER_STORE)) {
            db.createObjectStore(USER_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(CHAT_MESSAGE_STORE)) {
            db.createObjectStore(CHAT_MESSAGE_STORE, { keyPath: "id" });
        }
    },
});

// Chat message helpers

export const addChatMessage = async (message: ChatMessageEntity) => {
    const db = await dbPromise;
    await db.put(CHAT_MESSAGE_STORE, message);
};

export const getAllChatMessages = async (): Promise<ChatMessageEntity[]> => {
    const db = await dbPromise;
    return db.getAll(CHAT_MESSAGE_STORE);
};

export const saveChatMessages = async (chatMessages: ChatMessageEntity[]): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(CHAT_MESSAGE_STORE, "readwrite");

    const msgPromises = chatMessages.map((m) => tx.store.put(m));

    await Promise.all([...msgPromises, tx.done]);
};

// User helpers

export const saveUsers = async (users: UserEntity[]): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(USER_STORE, "readwrite");

    const userPromises = users.map((u) => tx.store.put(u));

    await Promise.all([...userPromises, tx.done]);
};

export const getAllUsers = async (): Promise<UserEntity[]> => {
    const db = await dbPromise;
    return db.getAll(USER_STORE);
};

// Bootstrap

export const bootstrapIdb = async (users: UserEntity[], chatMessages: ChatMessageEntity[]) => {
    await Promise.all([saveUsers(users), saveChatMessages(chatMessages)]);
};
