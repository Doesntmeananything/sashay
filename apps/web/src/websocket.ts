import { useSyncExternalStore } from "react";

import { api } from "./api";
import { chatStore } from "./chat/chat-store";

let socket: ReturnType<typeof api.ws.subscribe> | null = null;
let isConnected = false;

const subscribers = new Set<() => void>();
function notify() {
    for (const cb of subscribers) cb();
}

const connect = () => {
    if (socket) return socket;

    socket = api.ws.subscribe();

    socket.on("open", () => {
        console.log("WebSocket connected!");
        isConnected = true;
        notify();
    });

    socket.on("message", async ({ data }) => {
        if (data.type === "chat_message") {
            console.log("onmessage", data);

            await chatStore.receiveMessage({
                id: data.id,
                user_id: data.user_id,
                content: data.content,
                // Elysia/Eden parse ISO strings into date objects automatically, so we revert it here
                created_at: (data.created_at as unknown as Date).toISOString(),
            });
        }
    });

    socket.on("close", (e) => {
        console.log("WebSocket disconnected:", e.code, e.reason);

        if (e.code === 4001) {
            console.warn("Session expired, redirecting to login...");
        }

        isConnected = false;
        socket = null;
        notify();
    });

    socket.on("error", (err) => {
        console.error("WebSocket error:", err);
    });

    return socket;
};

const disconnect = () => {
    socket?.close();
};

const subscribe = (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
};
const getStatusSnapshot = () => isConnected;
export const useOnlineStatus = () => {
    const isOnline = useSyncExternalStore(subscribe, getStatusSnapshot);
    return isOnline;
};

export const ws = {
    connect,
    disconnect,
};
