import { treaty } from "@elysiajs/eden";
import type { App } from "../../api/src/main";

export const api = treaty<App>("localhost:3000", {
    fetch: {
        credentials: "include",
    },
});
