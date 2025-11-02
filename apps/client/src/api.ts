import { treaty } from "@elysiajs/eden";
import type { App } from "@sashay/server";

export const apiClient = treaty<App>("localhost:3000", {
    fetch: {
        credentials: "include",
    },
});
