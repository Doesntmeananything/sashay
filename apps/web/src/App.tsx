import { useEffect, useState } from "react";

import { api } from "./api";
import { chatStore } from "./chat/chat-store";
import { ChatPage } from "./chat/ChatPage";
import { DebugMenu } from "./chat/DebugMenu";
import { LoginScreen } from "./login/LoginScreen";
import { setCurrentUser } from "./storage/globals";
import * as idb from "./storage/indexedDB";
import { wsHandler } from "./sync/websocket";

let didInit = false;

type Screen = "loading" | "login" | "chat";

export const App = () => {
    const [screen, setScreen] = useState<Screen>("loading");

    useEffect(() => {
        const bootstrap = async () => {
            const { error, data } = await api.bootstrap.get();

            if (error) return setScreen("login");

            const { users, chatMessages, me } = data;

            await idb.bootstrapIdb(users, chatMessages);
            chatStore.init();
            wsHandler.connect();
            chatStore.connectToWebSocket();

            setCurrentUser(me);
            setScreen("chat");
        };

        if (!didInit) {
            didInit = true;
            bootstrap();
        }

        // Reset the init state to bootstrap again after login
        if (screen === "login") {
            didInit = false;
        }
    }, [screen]);

    if (screen === "loading") {
        return <div>Loading...</div>;
    }

    if (screen === "login") {
        return (
            <LoginScreen
                onLogin={() => {
                    setScreen("chat");
                }}
            />
        );
    }

    if (screen === "chat") {
        return (
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
    }
};
