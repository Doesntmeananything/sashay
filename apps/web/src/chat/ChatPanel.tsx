import type { ComponentProps } from "react";
import clsx from "clsx";

import { useChatMessages } from "./chat-store";

export const ChatPanel = ({ className, ...props }: ComponentProps<"div">) => {
    const messages = useChatMessages();

    return (
        <div className={clsx("flex flex-col justify-end border border-pink-50", className)} {...props}>
            {messages.map((m) => (
                <div key={m.id}>
                    {m.user_id}: {m.content}
                </div>
            ))}
        </div>
    );
};
