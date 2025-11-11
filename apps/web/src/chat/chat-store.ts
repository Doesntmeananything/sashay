import { useSyncExternalStore } from "react";

import type { ChatMessage } from "../../../api/src/main";

import { idb } from "../idb";
import { ws } from "../websocket";
import { ls } from "../local-storage";

let chatMessages: ChatMessage[] = [];

const subscribers = new Set<() => void>();
const notify = () => {
    for (const cb of subscribers) cb();
};

export const loadMessages = async () => {
    chatMessages = [...(await idb.getAllChatMessages())];
    notify();
};

export const sendMessage = async (message: Omit<ChatMessage, "id" | "created_at" | "user_id">) => {
    const id = crypto.randomUUID();
    const user = ls.loadUserInfo();
    const outgoing: ChatMessage = {
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        ...message,
    };

    await idb.addChatMessage(outgoing);

    chatMessages = [...chatMessages, outgoing];
    notify();

    const socket = ws.connect();
    socket.send({ type: "chat_message", id, content: message.content });
};

export const receiveMessage = async (message: ChatMessage) => {
    await idb.addChatMessage(message);
    chatMessages = [...chatMessages, message];
    notify();
};

export const chatStore = { loadMessages, sendMessage, receiveMessage };

const subscribe = (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
};
const getSnapshot = () => chatMessages;
export const useChatMessages = () => {
    const messages = useSyncExternalStore(subscribe, getSnapshot);
    return messages;
};
