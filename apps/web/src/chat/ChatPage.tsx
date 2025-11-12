import { useOnlineStatus } from "../websocket";

import { ChatMessageInput } from "./ChatMessageInput";
import { ChatPanel } from "./ChatPanel";

export const ChatPage = () => {
    const isConnected = useOnlineStatus();

    return (
        <main className="flex h-full flex-col gap-4 px-6">
            <div>ChatPage: {isConnected ? "Connected" : "Disconnected"}</div>

            <div className="flex h-full flex-col">
                <ChatPanel className="h-full overflow-auto" />
                <ChatMessageInput />
            </div>
        </main>
    );
};
