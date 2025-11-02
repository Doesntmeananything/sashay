import { createContext } from "react";

import type { Navigate } from "./Router";

export const RouterContext = createContext<Navigate | null>(null);
