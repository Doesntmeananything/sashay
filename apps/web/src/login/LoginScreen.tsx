import { useState, type FormEventHandler } from "react";
import { useFormStatus } from "react-dom";

import type { DefaultUsername } from "@sashay/api";

import { api } from "../api";
import { ws } from "../websocket";
import { ls } from "../local-storage";

const formIds: Readonly<[DefaultUsername, DefaultUsername]> = ["Andrey", "Sasha"];

const getInputId = (id: DefaultUsername) => `${id}-password` as const;

interface Props {
    onLogin?: () => void;
}

export const LoginScreen = ({ onLogin }: Props) => {
    const [user, setUser] = useState<DefaultUsername>("Sasha");

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        const target = e.target as HTMLFormElement;
        const id = target.id as DefaultUsername;

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
        <main>
            {formIds.map((formId) => (
                <form key={formId} id={formId} onSubmit={onSubmit}>
                    <LoginFormSubmit formId={formId} />
                </form>
            ))}
        </main>
    );
};

const LoginFormSubmit = ({ formId }: { formId: DefaultUsername }) => {
    const { pending } = useFormStatus();

    return (
        <>
            <label htmlFor={getInputId(formId)}>{formId}</label>
            <input id={getInputId(formId)} type="password" />
            <button type="submit" disabled={pending}>
                Login
            </button>
        </>
    );
};
