import { ws } from "../websocket";

export const DebugMenu = () => {
    return (
        <div>
            <button onClick={() => ws.connect()}>Connect</button>
            <button onClick={() => ws.disconnect()}>Disconnect</button>
        </div>
    );
};
