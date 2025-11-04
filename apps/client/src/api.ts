import { treaty } from "@elysiajs/eden";
import type { App } from "@sashay/server";

export const api = treaty<App>("localhost:3000", {
    fetch: {
        credentials: "include",
    },
});
