import type { ComponentProps } from "react";
import { useChatMessages } from "./chat-store";
import clsx from "clsx";

export const ChatPanel = ({ className, ...props }: ComponentProps<"div">) => {
    const messages = useChatMessages();

    return (
        <div className={clsx("border border-pink-50", className)} {...props}>
            {messages.map((m) => (
                <div key={m.id}>
                    {m.user_id}: {m.content}
                </div>
            ))}
        </div>
    );
};
