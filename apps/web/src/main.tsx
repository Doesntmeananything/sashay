import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { App } from "./App.tsx";

import "./index.css";

const fallbackRender = ({ error }: FallbackProps) => {
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: "red" }}>{error.message}</pre>
        </div>
    );
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary fallbackRender={fallbackRender}>
            <App />
        </ErrorBoundary>
    </StrictMode>,
);
