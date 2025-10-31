import { useEffect } from "react";
import { apiClient } from "./api-client";

export const useWebsocket = () => {
    useEffect(() => {
        const ws = apiClient.ws.subscribe();

        ws.subscribe((message) => {
            console.log("got", message);
        });

        return () => {
            ws.close();
        };
    }, []);
};
