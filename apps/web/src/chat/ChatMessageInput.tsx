import { Input } from "../ui/Input";

import { chatStore } from "./chat-store";

export const ChatMessageInput = () => {
    return (
        <Input
            type="text"
            onKeyDown={async (e) => {
                if (e.key === "Enter") {
                    const value = e.currentTarget.value.trim();

                    if (value) {
                        await chatStore.sendChatMessage(value);
                        (e.target as HTMLInputElement).value = "";
                    }
                }
            }}
        />
    );
};
