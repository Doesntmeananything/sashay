import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";

const users = [
  {
    id: "andrey",
    hash: await Bun.password.hash("andrey123"),
  },
  {
    id: "sasha",
    hash: await Bun.password.hash("sasha123"),
  },
];

const app = new Elysia()
  .use(cors())
  // Auth
  .post(
    "/auth/login",
    async ({ body, status, cookie: { sessionId } }) => {
      const { name, password } = body;

      const user = users.find((user) => user.id === name);
      if (!user) {
        return status(401);
      }

      const isValidPassword = await Bun.password.verify(password, user.hash);
      if (!isValidPassword) {
        return status(401);
      }

      // Get session id from DB
      sessionId.value = crypto.randomUUID();
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
