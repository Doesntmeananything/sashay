import { useOnlineStatus } from "../websocket";

import { ChatMessageInput } from "./ChatMessageInput";
import { ChatPanel } from "./ChatPanel";

export const ChatPage = () => {
    const isConnected = useOnlineStatus();

    return (
        <div>
            <div>ChatPage: {isConnected ? "Connected" : "Disconnected"}</div>

            <ChatPanel />
            <ChatMessageInput />
        </div>
    );
};
