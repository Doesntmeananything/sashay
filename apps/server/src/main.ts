import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";

import { db } from "./db";

await db.seed();

const app = new Elysia({
    websocket: {
        perMessageDeflate: true,
    },
})
    .use(cors())
    // Auth
    .post(
        "/login",
        async ({ body, status, cookie: { sessionId } }) => {
            const { name, password } = body;

            const user = db.getUser(name);
            if (!user) {
                return status(401);
            }

            const isValidPassword = await Bun.password.verify(password, user.password_hash);
            if (!isValidPassword) {
                return status(401);
            }

            const sessionIdValue = db.createSession(user.id);

            sessionId.value = sessionIdValue;
            sessionId.httpOnly = true;
            sessionId.secure = process.env.NODE_ENV === "production";
            sessionId.sameSite = "lax";
            sessionId.maxAge = 30 * 24 * 60 * 60; // 30 days
        },
        {
            body: t.Object({
                name: t.String(),
                password: t.String(),
            }),
        },
    )
    .ws("/ws", {
        message: (ws, message) => {
            const data = ws.data.query;

            ws.send(data);
        },
    })
    .listen(3000);

export type App = typeof app;

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
