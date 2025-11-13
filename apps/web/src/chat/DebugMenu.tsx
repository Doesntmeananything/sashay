import { useEffect, useRef, type MouseEventHandler } from "react";

import { api } from "../api";
import { ws } from "../sync/websocket";
import { Button } from "../ui/Button";

const LOCAL_STORAGE_KEY = "debugDialogPosition";

interface DialogPosition {
    x: number;
    y: number;
}

export const DebugMenu = ({ onLogout }: { onLogout: () => void }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    const dragOffset = useRef({ x: 0, y: 0 });
    const dragging = useRef(false);

    const setDialogPosition = (x: number, y: number) => {
        if (dialogRef.current) {
            dialogRef.current.style.left = `${x}px`;
            dialogRef.current.style.top = `${y}px`;
        }
    };

    const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
        dragging.current = true;

        const rect = dialogRef.current?.getBoundingClientRect();

        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    };

    const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
        if (dragging.current) {
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            setDialogPosition(x, y);
        }
    };

    const handleMouseUp = () => {
        dragging.current = false;

        const rect = dialogRef.current?.getBoundingClientRect();

        if (rect) {
            const { left, top } = rect;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ x: left, y: top }));
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        window.addEventListener(
            "keydown",
            (e) => {
                if (e.altKey && e.key.toLowerCase() === "d") {
                    e.preventDefault();

                    const dialog = dialogRef.current;
                    if (!dialog) return;

                    if (dialog.open) {
                        dialog.close();
                    } else {
                        dialog.show();

                        const { x, y } = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "{x: 100, y: 100}") as DialogPosition;
                        setDialogPosition(x, y);
                    }
                }
            },
            { signal: controller.signal },
        );

        return () => {
            controller.abort();
        };
    }, []);

    const closeDialog = () => {
        dialogRef.current?.close();
    };

    return (
        <dialog ref={dialogRef} closedby="closerequest" className="fixed border border-pink-300 outline-none">
            <div
                ref={dragHandleRef}
                className="flex cursor-grab items-center justify-between rounded-t-2xl px-3 py-2 active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <h2 className="text-sm">Debug menu</h2>
                <button className="outline-none" onClick={closeDialog}>
                    x
                </button>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => ws.connect()}>Connect</Button>
                <Button onClick={() => ws.disconnect()}>Disconnect</Button>
                <Button
                    onClick={async () => {
                        await api.logout.post();
                        onLogout();
                    }}
                >
                    Log out
                </Button>
            </div>
        </dialog>
    );
};
