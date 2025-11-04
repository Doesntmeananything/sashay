import Database from "bun:sqlite";

const sqlite = new Database("dev_db/dev.db", { strict: true });

// Set up wal mode
// https://bun.sh/docs/runtime/sqlite#wal-mode
sqlite.run("PRAGMA journal_mode = WAL;");

//#region Sessions
interface Session {
    id: string;
    user_id: string;
    created_at: string;
    expires_at: string;
}

sqlite.run(`
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

const createSession = (userId: string) => {
    // TODO: add a check to avoid creating multiple sessions for a user on the same device
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    sqlite.run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [sessionId, userId, expiresAt]);

    return sessionId;
};

export interface SessionResponse {
    id: Session["id"];
    user_id: Session["user_id"];
    username: User["username"];
}

const getSession = (sessionId: string) => {
    const session = sqlite
        .query(
            `SELECT s.id, s.user_id, u.username
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
            `,
        )
        .get(sessionId) as SessionResponse | undefined;

    return session;
};

const getAllSessions = () => {
    return sqlite
        .query(
            `SELECT s.id, s.user_id, u.username
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > CURRENT_TIMESTAMP
            `,
        )
        .all() as SessionResponse[];
};
// #endregion

// #region Users
interface User {
    id: string;
    username: string;
    password_hash: string;
}

sqlite.run(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
`);

// Helper function for development
const createUser = async (username: string, plainPassword: string) => {
    const existing = sqlite.query("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return;

    const id = crypto.randomUUID();
    const hash = await Bun.password.hash(plainPassword);

    sqlite.run("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", [id, username, hash]);

    console.log(`✅ Created user: ${username}`);
};

const getUserById = (userId: string) => {
    return sqlite.query("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
};

const getUserByName = (username: string) => {
    return sqlite.query("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
};
// #endregion

// #region Chat messages
export interface ChatMessage {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
}

sqlite.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
const createChatMessage = (chatMessageId: string, userId: string, content: string, createdAt: string): ChatMessage => {
    sqlite.run("INSERT INTO chat_messages (id, user_id, content, created_at) VALUES (?, ?, ?, ?)", [
        chatMessageId,
        userId,
        content,
        createdAt,
    ]);

    return {
        id: chatMessageId,
        user_id: userId,
        content,
        created_at: createdAt,
    };
};
// #endregion

const seed = async () => {
    await Promise.all([createUser("Andrey", "andrey123"), createUser("Sasha", "sasha123")]);
};

export const db = {
    seed,
    createSession,
    getSession,
    getAllSessions,
    getUserById,
    getUserByName,
    createChatMessage,
};
