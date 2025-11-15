import type { UserEntity } from "@sashay/api";

let currentUser: UserEntity | null = null;

export const setCurrentUser = (user: UserEntity) => {
    currentUser = user;
};

export const getCurrentUser = () => {
    if (!currentUser) {
        throw new Error("currentUser is null! Make sure to initialize the current user at the start of the application.");
    }

    return currentUser;
};
