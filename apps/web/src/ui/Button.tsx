import clsx from "clsx";
import type { ComponentProps } from "react";

export const Button = ({ className, ...props }: ComponentProps<"button">) => {
    return (
        <button
            className={clsx(
                // layout & shape
                "inline-flex items-center justify-center font-medium transition-all select-none will-change-transform",
                "px-4 py-1.5 text-base",
                // base colors
                "bg-[oklch(var(--btn-bg,75%_0.15_350))]",
                "text-[oklch(var(--btn-fg,100%_0.02_250))]",
                // hover & active states
                "hover:bg-[oklch(var(--btn-bg-hover,65%_0.15_350))]",
                "active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--btn-bg,75%_0.15_350))]",
                // shadows & transitions
                "shadow-sm hover:shadow-md",
                className,
            )}
            {...props}
        />
    );
};
