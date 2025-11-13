interface UserInfo {
    id: string;
}

const STORAGE_KEY = "currentUser";

export const saveUserInfo = (user: UserInfo) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const loadUserInfo = (): UserInfo => {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        throw new Error("No user info in local storage! Fix this by making sure that the user info is stored before sending messages.");
    }

    return JSON.parse(raw);
};
