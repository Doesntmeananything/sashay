import Database from "bun:sqlite";

const sqlite = new Database("dev_db/dev.db", { strict: true });

// Set up wal mode
// https://bun.sh/docs/runtime/sqlite#wal-mode
sqlite.run("PRAGMA journal_mode = WAL;");

//#region Events
sqlite.run(`
CREATE TABLE IF NOT EXISTS event_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_data TEXT,
    entity_changes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_event_log_created_at ON event_log (created_at);
CREATE INDEX IF NOT EXISTS idx_event_log_entity ON event_log (entity_type, entity_id);
`);

type Event = UserEvent | ChatMessageEvent;

interface BaseEvent {
    id: string;
    entity_type: "user" | "chat_message";
    entity_id: string;
    event_type: "create" | "update" | "delete";
    created_at: string;
}

interface CreateEvent<T> extends BaseEvent {
    event_type: "create";
    entity_data: T;
    entity_changes?: never;
}

interface UpdateEvent<T> extends BaseEvent {
    event_type: "update";
    entity_changes: {
        [key in keyof T]: { updated_from: string; updated_to: string };
    };
    entity_data?: never;
}

interface DeleteEvent extends BaseEvent {
    event_type: "delete";
    entity_data?: never;
    entity_changes?: never;
}

type UserEvent = UpdateEvent<Pick<User, "username">> & { entity_type: "user" };

type ChatMessageEvent = (
    | CreateEvent<Pick<ChatMessage, "user_id" | "content">>
    | UpdateEvent<Pick<ChatMessage, "content">>
    | DeleteEvent
) & { entity_type: "chat_message" };

export const appendEvent = (event: Event) => {
    const { entity_type, entity_id, event_type, entity_data, entity_changes } = event;

    const tx = sqlite.transaction(() => {
        const entity_data_stmt = event_type === "create" ? JSON.stringify(entity_data) : null;
        const entity_changes_stmt = event_type === "update" ? JSON.stringify(entity_changes) : null;

        sqlite.run(`INSERT INTO event_log (entity_type, entity_id, event_type, entity_data, entity_changes) VALUES (?, ?, ?, ?, ?)`, [
            entity_type,
            entity_id,
            event_type,
            entity_data_stmt,
            entity_changes_stmt,
        ]);

        switch (entity_type) {
            case "user": {
                switch (event_type) {
                    case "update": {
                        const username = entity_changes.username.updated_to;
                        sqlite.run(`UPDATE users SET username = ? WHERE id = ?`, [username, entity_id]);
                        break;
                    }
                }
                break;
            }

            case "chat_message": {
                switch (event_type) {
                    case "create": {
                        const { content, user_id } = entity_data;
                        sqlite.run(`INSERT INTO chat_messages (id, user_id, content) VALUES (?, ?, ?)`, [entity_id, user_id, content]);
                        break;
                    }
                    case "update": {
                        const { content } = entity_changes;
                        sqlite.run(`UPDATE chat_messages SET content = ? WHERE id = ?`, [content, entity_id]);
                        break;
                    }
                    case "delete": {
                        sqlite.run(`DELETE FROM chat_messages WHERE id = ?`, [entity_id]);
                        break;
                    }
                }
            }
        }
    });

    tx();

    return event.id;
};

//#endregion

//#region Sessions
sqlite.run(`
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT DEFAULT (datetime('now'))
);`);

interface Session {
    id: string;
    user_id: string;
    created_at: string;
    expires_at: string;
}

export const createSession = (userId: string) => {
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

export const getSession = (sessionId: string) => {
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

export const getAllSessions = () => {
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

sqlite.run(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    last_seen_at TEXT
);

CREATE TRIGGER IF NOT EXISTS users_set_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users
    SET updated_at = datetime('now')
    WHERE id = OLD.id;
END;
`);

interface UserWithPasswordHash {
    id: string;
    username: string;
    password_hash: string;
    updated_at: string;
    last_seen_at: string;
}

export type User = Omit<UserWithPasswordHash, "password_hash">;

export type DefaultUsername = "Andrey" | "Sasha";

// Helper function for development
const createUser = async (username: DefaultUsername, plainPassword: string) => {
    const existing = sqlite.query("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return;

    const id = crypto.randomUUID();
    const password_hash = await Bun.password.hash(plainPassword);

    sqlite.run("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", [id, username, password_hash]);

    console.log(`✅ Created user: ${username}`);
};

export const getUserById = (userId: string) => {
    return sqlite.query("SELECT * FROM users WHERE id = ?").get(userId) as UserWithPasswordHash | undefined;
};

export const getUserByName = (username: string) => {
    return sqlite.query("SELECT * FROM users WHERE username = ?").get(username) as UserWithPasswordHash | undefined;
};

export const getAllUsers = () => {
    return sqlite.query("SELECT id, username FROM users ORDER BY username ASC").all() as User[];
};

// #endregion

// #region Chat messages

sqlite.run(`
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE TRIGGER IF NOT EXISTS chat_messages_set_updated_at
AFTER UPDATE ON chat_messages
FOR EACH ROW
BEGIN
    UPDATE chat_messages
    SET updated_at = datetime('now')
    WHERE id = OLD.id;
END;
`);

export interface ChatMessage {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export const createChatMessage = (chatMessageId: string, userId: string, content: string, createdAt: string): ChatMessage => {
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

export const getAllChatMessages = () => {
    return sqlite
        .query(
            `SELECT id, user_id, content, created_at 
            FROM chat_messages
            ORDER BY datetime(created_at) ASC`,
        )
        .all() as ChatMessage[];
};

// #endregion

export const seed = async () => {
    await Promise.all([createUser("Andrey", "andrey123"), createUser("Sasha", "sasha123")]);
};
