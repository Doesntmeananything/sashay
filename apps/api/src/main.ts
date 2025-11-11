import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";

import { db, type SessionResponse } from "./db";

await db.seed();

const PUBSUB_TOPICS = {
    CHAT: "chat",
};

const WebSocketMessageResponseSchema = t.Union([
    t.Object({
        type: t.Literal("connected"),
        user_id: t.String(),
        username: t.String(),
        connected_at: t.String(),
    }),
    t.Object({
        type: t.Literal("chat_message"),
        id: t.String(),
        user_id: t.String(),
        created_at: t.String(),
        content: t.String(),
    }),
    t.Object({
        type: t.Literal("disconnected"),
        user_id: t.String(),
        disconnected_at: t.String(),
    }),
]);

const app = new Elysia({
    websocket: {
        perMessageDeflate: true,
    },
})
    .use(cors())
    .decorate({ sessions: new Map<string, SessionResponse>() })

    .post(
        "/login",
        async ({ body, status, cookie: { sessionId, userId } }) => {
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

            const sessionIdValue = db.createSession(user.id);

            sessionId.value = sessionIdValue;
            sessionId.httpOnly = true;
            sessionId.secure = Bun.env.NODE_ENV === "production";
            sessionId.sameSite = "lax";
            sessionId.maxAge = 30 * 24 * 60 * 60; // 30 days

            userId.value = user.id;
            userId.httpOnly = true;
            userId.secure = Bun.env.NODE_ENV === "production";
            userId.sameSite = "lax";
            userId.maxAge = 30 * 24 * 60 * 60; // 30 days

            return { user_id: user.id };
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
            cookie: t.Cookie({
                sessionId: t.String(),
                userId: t.String(),
            }),
            beforeHandle: ({ status, cookie }) => {
                const sessionId = cookie.sessionId.value;

                const session = db.getSession(sessionId);
                if (!session) {
                    return status(401);
                }
            },
        },

        (app) =>
            app
                .get(
                    "/me",
                    ({ status, cookie }) => {
                        const sessionId = cookie.sessionId.value;
                        const userId = cookie.userId.value;

                        const session = db.getSession(sessionId);
                        if (!session) {
                            return status(401);
                        }

                        const user = db.getUserById(userId);
                        if (!user) {
                            return status(401);
                        }

                        return { id: user.id, username: user.username };
                    },
                    {
                        cookie: t.Cookie({
                            sessionId: t.String(),
                            userId: t.String(),
                        }),
                    },
                )

                .get("/bootstrap", () => {})

                .ws("/ws", {
                    cookie: t.Cookie({
                        sessionId: t.String(),
                        userId: t.String(),
                    }),
                    body: t.Object({
                        type: t.String(),
                        id: t.String(),
                        content: t.String(),
                    }),
                    response: WebSocketMessageResponseSchema,

                    open: (ws) => {
                        const sessionId = ws.data.cookie.sessionId.value;
                        const userId = ws.data.cookie.userId.value;

                        let session = sessionId ? db.getSession(sessionId) : null;

                        if (!session && Bun.env.NODE_ENV === "development") {
                            const testSessionId = db.createSession(userId);
                            session = db.getSession(testSessionId)!;
                        } else if (!session) {
                            ws.close(4001, "Unauthorized");
                            return;
                        }

                        ws.data.sessions.set(ws.id, session);

                        ws.subscribe(PUBSUB_TOPICS.CHAT);
                        ws.publish(PUBSUB_TOPICS.CHAT, {
                            type: "connected",
                            user_id: session.user_id,
                            username: session.username,
                            connected_at: new Date().toISOString(),
                        });

                        console.log(`[WS]: ${session.username} connected`);
                    },

                    message: (ws, message) => {
                        const userId = ws.data.cookie.userId.value;

                        const sender = ws.data.sessions.get(ws.id);
                        if (!sender) return;

                        const { id, content } = message;

                        const createdAt = new Date().toISOString();
                        try {
                            db.createChatMessage(id, userId, content, createdAt);
                        } catch (error) {
                            console.error(error);
                        }

                        ws.publish(PUBSUB_TOPICS.CHAT, { type: "chat_message", id, user_id: userId, created_at: createdAt, content });

                        console.log(`[WS]: Published message to topic "${PUBSUB_TOPICS.CHAT}"`);
                        console.log({ type: "chat_message", user_id: userId, created_at: createdAt, content });
                    },

                    close: (ws) => {
                        ws.unsubscribe(PUBSUB_TOPICS.CHAT);

                        const session = ws.data.sessions.get(ws.id);
                        if (session) {
                            ws.data.sessions.delete(ws.id);
                            console.log(`[WS]: ${session.username} disconnected`);
                        }
                    },
                }),
    )
    .listen(3000);

// Type re-exports for the web client
export type App = typeof app;
export { type ChatMessage, type DefaultUsername } from "./db";

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
