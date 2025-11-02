import { useContext } from "react";

import { RouterContext } from "./router-context";

export const useNavigate = () => {
    const navigate = useContext(RouterContext);

    if (!navigate) {
        throw new Error("useNavigate must be used within a RouterContext");
    }

    return navigate;
};
