import { useState, type FormEventHandler } from "react";

import { api } from "../api";
import { ws } from "../websocket";
import { ls } from "../local-storage";

const formIds = ["andrey", "sasha"] as const;

type InputId = (typeof formIds)[number];

const getInputId = (id: InputId) => `${id}-password` as const;

interface Props {
    onLogin?: () => void;
}

export const LoginScreen = ({ onLogin }: Props) => {
    const [user, setUser] = useState<InputId>("sasha");

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        const target = e.target as HTMLFormElement;
        const id = target.id as InputId;

        const inputId = getInputId(id);
        const input = target.elements.namedItem(inputId) as HTMLInputElement;
        const password = input.value;

        const { data, error } = await api.login.post({ name: id, password });

        if (error) {
            console.error(error);
            return;
        }

        ls.saveUserInfo({ id: data.user_id });

        ws.connect();

        onLogin?.();
    };

    return (
        <main className="login-screen">
            <div className="bg-animated-sasha">
                <div>
                    <form onSubmit={onSubmit}>
                        <label htmlFor={"sasha"}>{"Sasha"}</label>
                        <input id={"sasha"} type="password" />
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
        </main>
    );
};
