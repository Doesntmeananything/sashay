import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

export default App;
