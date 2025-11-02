import { Suspense } from "react";

import { Router } from "./router/Router";

export const App = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Router />
        </Suspense>
    );
};
