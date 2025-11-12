import { useEffect, useState } from "react";

import { api } from "./api";
import { ChatPage } from "./chat/ChatPage";
import { LoginScreen } from "./login/LoginScreen";
import { DebugMenu } from "./chat/DebugMenu";

type Screen = "loading" | "login" | "chat";

let didInit = false;

export const App = () => {
    const [screen, setScreen] = useState<Screen>("loading");

    useEffect(() => {
        const bootstrap = async () => {
            const { error } = await api.me.get();

            if (error) {
                return setScreen("login");
            }

            setScreen("chat");
        };

        if (!didInit) {
            didInit = true;
            bootstrap();
        }
    }, []);

    let content = (
        <>
            <ChatPage />
            {process.env.NODE_ENV === "development" && (
                <DebugMenu
                    onLogout={() => {
                        setScreen("login");
                    }}
                />
            )}
        </>
    );

    if (screen === "loading") {
        content = <div>Loading...</div>;
    }

    if (screen === "login") {
        content = (
            <LoginScreen
                onLogin={() => {
                    setScreen("chat");
                }}
            />
        );
    }

    return content;
};
