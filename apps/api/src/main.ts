import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";

import * as db from "./db";

await db.seed();

const PUBSUB_TOPICS = {
    CHAT: "chat",
};

const app = new Elysia({
    websocket: {
        perMessageDeflate: true,
    },
})
    .use(cors())
    .decorate({ sessions: new Map(db.getAllSessions().map((s) => [s.id, s] as const)) })

    .post(
        "/login",
        async ({ body, status, cookie: { sessionId }, sessions }) => {
            const { name, password } = body;

            const user = db.getUserByName(name);
            if (!user) {
                console.log("/login error: user not found!");
                return status(401);
            }

            const isValidPassword = await Bun.password.verify(password, user.password_hash);
            if (!isValidPassword) {
                return status(401);
            }

            const session = db.createSession(user.id);

            sessions.set(session.id, session);

            const maxAge30Days = 30 * 24 * 60 * 60;
            sessionId.value = session.id;
            sessionId.httpOnly = true;
            sessionId.secure = Bun.env.NODE_ENV === "production";
            sessionId.sameSite = "lax";
            sessionId.maxAge = maxAge30Days;

            const UserEntity: db.UserEntity = {
                id: user.id,
                username: user.username,
                updated_at: user.updated_at,
                last_seen_at: user.last_seen_at,
            };

            return UserEntity;
        },
        {
            body: t.Object({
                name: t.String(),
                password: t.String(),
            }),
        },
    )

    .guard(
        {
            cookie: t.Cookie(
                {
                    sessionId: t.String({ format: "uuid" }),
                },
                {
                    secure: true,
                    httpOnly: true,
                },
            ),
            beforeHandle: ({ status, cookie }) => {
                const sessionId = cookie.sessionId.value;
                const session = db.getSession(sessionId);

                if (!session) return status(401);
            },
        },

        (app) =>
            app
                .post("/logout", ({ status, cookie: { sessionId }, sessions }) => {
                    const hasDeleted = sessions.delete(sessionId.value);

                    if (!hasDeleted) {
                        return status(404);
                    }

                    sessionId.remove();

                    return status(200);
                })

                .get("/bootstrap", ({ cookie, sessions, status }) => {
                    const sessionId = cookie.sessionId.value;
                    const session = sessions.get(sessionId);

                    if (!session) {
                        return status(401, "No session found");
                    }

                    const users = db.getAllUsers();
                    const chatMessages = db.getAllChatMessages();
                    const me = db.getUserById(session.user_id);

                    if (!me) {
                        return status(401, "No user found");
                    }

                    const lastEventId = db.getLastEventId();

                    return {
                        users,
                        chatMessages,
                        me: {
                            id: me.id,
                            username: me.username,
                            updated_at: me.updated_at,
                            last_seen_at: me.last_seen_at,
                        } satisfies db.UserEntity,
                        lastSyncId: lastEventId,
                    };
                })

                .ws("/ws", {
                    body: db.EventSchema,
                    response: db.EventSchema,

                    open: (ws) => {
                        const sessionId = ws.data.cookie.sessionId.value;

                        const session = sessionId ? db.getSession(sessionId) : null;

                        if (!session) {
                            ws.close(4001, "Unauthorized");
                            return;
                        }

                        const user = db.getUserById(session.user_id);
                        if (!user) {
                            ws.close(4001, "Unauthorized");
                            return;
                        }

                        ws.subscribe(PUBSUB_TOPICS.CHAT);

                        console.log(`[WS]: ${user.username} connected`);
                    },

                    message: (ws, message) => {
                        switch (message.entity_type) {
                            case "chat_message": {
                                switch (message.event_type) {
                                    case "create": {
                                        const { entity_data } = message;
                                        const { content, user_id } = entity_data;
                                        const createdAt = new Date().toISOString();

                                        try {
                                            db.appendEvent(message);
                                        } catch (error) {
                                            console.error(error);
                                        }

                                        ws.publish(PUBSUB_TOPICS.CHAT, message);

                                        console.log(`[WS]: Published message to topic "${PUBSUB_TOPICS.CHAT}"`);
                                        console.log({ type: "chat_message", user_id, created_at: createdAt, content });

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
                    },

                    close: (ws) => {
                        const sessionId = ws.data.cookie.sessionId.value;

                        ws.unsubscribe(PUBSUB_TOPICS.CHAT);

                        const session = ws.data.sessions.get(sessionId);

                        if (session) {
                            const user = db.getUserById(session.user_id);

                            if (user) console.log(`[WS]: ${user?.username} disconnected`);
                        }
                    },
                }),
    )
    .listen(3000);

// Type re-exports for the web client
export type App = typeof app;
export { type ChatMessageEntity, type DefaultUsername, type UserEntity, type EventEntity } from "./db";

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
