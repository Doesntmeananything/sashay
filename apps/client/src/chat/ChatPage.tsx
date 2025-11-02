import { useOnlineStatus, ws } from "../websocket";

import { ChatMessageInput } from "./ChatMessageInput";
import { ChatPanel } from "./ChatPanel";

export const ChatPage = () => {
    const isConnected = useOnlineStatus();

    return (
        <div>
            <div>ChatPage: {isConnected ? "Connected" : "Disconnected"}</div>
            <button onClick={() => ws.connect()}>Connect</button>
            <button onClick={() => ws.disconnect()}>Disconnect</button>

            <ChatPanel />
            <ChatMessageInput />
        </div>
    );
};
