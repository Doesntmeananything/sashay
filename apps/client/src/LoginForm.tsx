import type { FormEventHandler } from "react";
import { apiClient } from "./api-client";

const formIds = ["andrey", "sasha"] as const;

type InputId = (typeof formIds)[number];

const getInputId = (id: InputId) => `${id}-password` as const;

export const LoginForm = () => {
    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const target = e.target as HTMLFormElement;
        const id = target.id as InputId;

        const inputId = getInputId(id);
        const input = target.elements.namedItem(inputId) as HTMLInputElement;
        const password = input.value;

        apiClient.login.post({ name: id, password }, { fetch: { credentials: "include" } });
    };

    return (
        <>
            {formIds.map((id) => {
                const inputId = getInputId(id);

                return (
                    <form key={id} id={id} onSubmit={onSubmit}>
                        <label htmlFor={inputId}>{id === "andrey" ? "Andrey" : "Sasha"}</label>
                        <input id={inputId} type="password" />
                        <button type="submit">Login</button>
                    </form>
                );
            })}
        </>
    );
};
