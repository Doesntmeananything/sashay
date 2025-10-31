import Database from "bun:sqlite";

const sqlite = new Database(":memory:", { strict: true });

// Set up wal mode
// https://bun.sh/docs/runtime/sqlite#wal-mode
sqlite.run("PRAGMA journal_mode = WAL;");

// Set up users
sqlite.run(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
`);

interface User {
    id: string;
    username: string;
    password_hash: string;
}

// Set up sessions
sqlite.run(`
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Sessions
const createSession = (userId: string) => {
    // TODO: add a check to avoid creating multiple sessions for a user on the same device
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    sqlite.run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [sessionId, userId, expiresAt]);

    return sessionId;
};

const getSession = (sessionId: string) => {
    return sqlite
        .query(
            `SELECT s.id, s.user_id, u.username
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
            `,
        )
        .get(sessionId) as { id: string; user_id: string; username: string } | undefined;
};

// Users
// Helper function for development
const createUser = async (username: string, plainPassword: string) => {
    const existing = sqlite.query("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return;

    const id = crypto.randomUUID();
    const hash = await Bun.password.hash(plainPassword);

    sqlite.run("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", [id, username, hash]);

    console.log(`✅ Created user: ${username}`);
};

const seed = async () => {
    await createUser("andrey", "andrey123");
    await createUser("sasha", "sasha123");
};

const getUser = (username: string) => {
    return sqlite.query("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
};

export const db = {
    seed,
    createSession,
    getSession,
    getUser,
};
