import { useEffect, useState, useTransition, type ReactNode } from "react";

import { RouterContext } from "./router-context";
import { LoginPage } from "../login/LoginPage";
import { ChatPage } from "../chat/ChatPage";

export type Routes = "/" | "/chat";

export type Navigate = (url: Routes, options?: { replace: boolean }) => void;

export const Router = () => {
    const [page, setPage] = useState<Routes>(() => {
        const path = window.location.pathname as Routes;
        return path === "/chat" ? "/chat" : "/";
    });

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const onPopState = () => {
            const path = window.location.pathname as Routes;
            startTransition(() => {
                setPage(path === "/chat" ? "/chat" : "/");
            });
        };

        window.addEventListener("popstate", onPopState);
        return () => {
            window.removeEventListener("popstate", onPopState);
        };
    }, []);

    const navigate: Navigate = (url, options = { replace: false }) => {
        const { replace } = options;

        startTransition(() => {
            setPage(url);

            if (replace) {
                window.history.replaceState({}, "", url);
            } else {
                window.history.pushState({}, "", url);
            }
        });
    };

    let content: ReactNode | null = null;

    if (page === "/") {
        content = <LoginPage isPending={isPending} />;
    } else if (page === "/chat") {
        content = <ChatPage />;
    }

    return (
        <RouterContext value={navigate}>
            <Layout isPending={isPending}>{content}</Layout>
        </RouterContext>
    );
};

interface LayoutProps {
    children: ReactNode;
    isPending: boolean;
}

const Layout = ({ children, isPending }: LayoutProps) => {
    return <main>{children}</main>;
};
