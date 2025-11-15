import { useSyncExternalStore } from "react";

import type { ChatMessageEntity, UserEntity } from "@sashay/api";

import { getCurrentUser } from "../storage/globals";
import * as idb from "../storage/indexedDB";
import { wsHandler } from "../sync/websocket";

interface ChatMessage extends ChatMessageEntity {
    author: UserEntity;
}

type Subscriber = () => void;

class ChatStore {
    private externalStoreSubscribers = new Set<Subscriber>();

    users = new Map<string, UserEntity>();
    chatMessages: ChatMessage[] = [];

    init = async () => {
        const [users, chatMessages] = await Promise.all([idb.getAllUsers(), idb.getAllChatMessages()]);

        users.forEach((u) => this.users.set(u.id, u));

        this.chatMessages = chatMessages.map((m) => {
            const author = this.users.get(m.user_id);

            if (!author) {
                console.error(`Could not find author for message ${m.id}`);
            }

            return { ...m, author: author! };
        });
        this.notify();
    };

    sendChatMessage = async (content: string) => {
        const user = getCurrentUser();

        const msg: ChatMessageEntity = {
            id: crypto.randomUUID(),
            user_id: user.id,
            content,
            created_at: new Date().toISOString(),
        };

        await idb.addChatMessage(msg);

        this.chatMessages = [...this.chatMessages, { ...msg, author: user }];
        this.notify();

        wsHandler.send({
            id: crypto.randomUUID(),
            event_type: "create",
            entity_type: "chat_message",
            entity_id: msg.id,
            created_at: msg.created_at,
            entity_data: {
                user_id: msg.user_id,
                content: msg.content,
            },
        });
    };

    connectToWebSocket = () => {
        wsHandler.onMessage(async (event) => {
            switch (event.entity_type) {
                case "user": {
                    break;
                }
                case "chat_message": {
                    switch (event.event_type) {
                        case "create": {
                            const created_at_raw = event.created_at as unknown;
                            const user_id = event.entity_data.user_id;

                            const chatMessage = {
                                id: event.entity_id,
                                user_id,
                                content: event.entity_data.content,
                                created_at: created_at_raw instanceof Date ? created_at_raw.toISOString() : event.created_at,
                            };

                            await idb.addChatMessage(chatMessage);

                            const author = this.users.get(user_id);

                            if (!author) {
                                console.error(`Could not find author for message ${event.entity_id}`);
                            }

                            this.chatMessages = [...this.chatMessages, { ...chatMessage, author: author! }];

                            break;
                        }
                        case "update": {
                            break;
                        }
                        case "delete": {
                            break;
                        }
                    }
                }
            }

            this.notify();
        });
    };

    subscribe = (sub: Subscriber) => {
        this.externalStoreSubscribers.add(sub);

        return () => this.externalStoreSubscribers.delete(sub);
    };

    getSnapshot = () => {
        return this.chatMessages;
    };

    private notify = () => {
        for (const sub of this.externalStoreSubscribers) {
            sub();
        }
    };
}

export const chatStore = new ChatStore();

export const useChatMessages = () => {
    return useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot);
};
