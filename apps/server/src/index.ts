import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .ws("/ws", {
    message: (ws, message) => {
      const data = ws.data.query;

      ws.send(data);
    },
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
