import type { FormEventHandler } from "react";

import { apiClient } from "../api";
import { useNavigate } from "../router/use-navigate";
import { ws } from "../websocket";
import { ls } from "../local-storage";

const formIds = ["andrey", "sasha"] as const;

type InputId = (typeof formIds)[number];

const getInputId = (id: InputId) => `${id}-password` as const;

interface Props {
    isPending: boolean;
}

export const LoginPage = ({ isPending }: Props) => {
    const navigate = useNavigate();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        const target = e.target as HTMLFormElement;
        const id = target.id as InputId;

        const inputId = getInputId(id);
        const input = target.elements.namedItem(inputId) as HTMLInputElement;
        const password = input.value;

        const { data, error } = await apiClient.login.post({ name: id, password });

        if (error) {
            console.error(error);
            return;
        }

        ls.saveUserInfo({ id: data.user_id });

        ws.connect();
        navigate("/chat", { replace: true });
    };

    return (
        <>
            {formIds.map((id) => {
                const inputId = getInputId(id);

                return (
                    <form key={id} id={id} onSubmit={onSubmit}>
                        <label htmlFor={inputId}>{id === "andrey" ? "Andrey" : "Sasha"}</label>
                        <input id={inputId} type="password" />
                        <button type="submit" disabled={isPending}>
                            Login
                        </button>
                    </form>
                );
            })}
        </>
    );
};
