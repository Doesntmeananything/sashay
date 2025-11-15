import { useSyncExternalStore } from "react";

import type { EventEntity } from "@sashay/api";

import { api } from "../api";

type Listener = (event: EventEntity) => Promise<void>;
type Subscriber = () => void;

export class WebSocketHandler {
    private ws: ReturnType<typeof api.ws.subscribe> | null = null;
    private listeners = new Set<Listener>();
    private externalStoreSubscribers = new Set<Subscriber>();
    private isConnected = false;

    connect = () => {
        this.ws = api.ws.subscribe();

        this.ws.on("open", () => {
            console.log("WebSocket connected!");

            this.isConnected = true;
            this.notify();
        });

        this.ws.on("message", ({ data }) => {
            this.listeners.forEach((l) => l(data));
        });

        this.ws.on("close", (e) => {
            this.isConnected = false;
            this.notify();

            console.log("WebSocket disconnected:", e.code, e.reason);

            if (e.code === 4001) {
                console.warn("Session expired, redirecting to login...");
            }
        });

        this.ws.on("error", (err) => {
            console.error("WebSocket error:", err);
        });
    };

    onMessage = (listener: Listener) => {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    };

    send = (event: EventEntity) => {
        this.ws?.send(event);
    };

    disconnect = () => {
        this.ws?.close();
        this.isConnected = false;
        this.ws = null;
    };

    getIsConnected = () => {
        return this.isConnected;
    };

    subscribe = (sub: Subscriber) => {
        this.externalStoreSubscribers.add(sub);

        return () => this.externalStoreSubscribers.delete(sub);
    };

    private notify = () => {
        for (const sub of this.externalStoreSubscribers) {
            sub();
        }
    };
}

export const wsHandler = new WebSocketHandler();

export const useOnlineStatus = () => {
    const isOnline = useSyncExternalStore(wsHandler.subscribe, wsHandler.getIsConnected);
    return isOnline;
};
