import { useTransition, type FormEventHandler } from "react";

import type { DefaultUsername } from "@sashay/api";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

import { api } from "../api";
import { ws } from "../websocket";
import { ls } from "../local-storage";

const formIds: Readonly<[DefaultUsername, DefaultUsername]> = ["Andrey", "Sasha"];

const generateInputId = (id: DefaultUsername) => `${id}-password` as const;
const generateErrorSpanId = (id: DefaultUsername) => `${id}-error` as const;

interface Props {
    onLogin?: () => void;
}

export const LoginScreen = ({ onLogin }: Props) => {
    const [isPending, startTransition] = useTransition();

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        startTransition(async () => {
            const target = e.target as HTMLFormElement;
            const id = target.id as DefaultUsername;

            const inputId = generateInputId(id);
            const input = document.getElementById(inputId) as HTMLInputElement;
            const password = input.value;

            const errorId = generateErrorSpanId(id);
            const errorSpan = document.getElementById(errorId) as HTMLSpanElement;

            if (!password) {
                input.setCustomValidity("Password is required");
                errorSpan.textContent = "Password is required";
                return;
            }

            const { data, error } = await api.login.post({ name: id, password });

            if (error) {
                input.setCustomValidity("Wrong password");
                errorSpan.textContent = "Wrong password";
                return;
            }

            ls.saveUserInfo({ id: data.user_id });

            ws.connect();

            onLogin?.();
        });
    };

    return (
        <main className="pt-[20%] flex justify-center h-fit gap-4">
            {formIds.map((formId) => (
                <form key={formId} id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-2">
                    <label htmlFor={generateInputId(formId)}>{formId}</label>

                    <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-2">
                            <Input
                                id={generateInputId(formId)}
                                type="password"
                                disabled={isPending}
                                className="peer invalid:border-red-600"
                            />
                            <span
                                id={`${generateErrorSpanId(formId)}`}
                                className="peer-invalid:visible h-5 text-sm invisible text-red-500"
                            />
                        </div>

                        <Button type="submit" disabled={isPending}>
                            Login
                        </Button>
                    </div>
                </form>
            ))}
        </main>
    );
};
