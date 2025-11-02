import { useChatMessages } from "./chat-store";

export const ChatPanel = () => {
    const messages = useChatMessages();

    return (
        <div>
            {messages.map((m) => (
                <div key={m.id}>
                    {m.user_id}: {m.content}
                </div>
            ))}
        </div>
    );
};
