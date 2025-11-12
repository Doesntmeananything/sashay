import clsx from "clsx";
import type { ComponentProps } from "react";

export const Input = ({ className, type, ...props }: ComponentProps<"input">) => {
    return (
        <input
            type={type}
            className={clsx(
                "h-9 w-full min-w-0 border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:ring-[3px]",
                className,
            )}
            {...props}
        />
    );
};
