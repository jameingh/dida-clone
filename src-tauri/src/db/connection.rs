use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct Database {
    pub conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // 创建任务表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                list_id TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                priority INTEGER NOT NULL DEFAULT 0,
                due_date INTEGER,
                reminder INTEGER,
                parent_id TEXT,
                order_num INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                completed_at INTEGER,
                FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 确保 is_deleted 列存在 (简单迁移)
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0", []);

        // 创建清单表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS lists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                is_smart INTEGER NOT NULL DEFAULT 0,
                order_num INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // 创建标签表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // 创建任务标签关联表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS task_tags (
                task_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (task_id, tag_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)",
            [],
        )?;

        Ok(())
    }
}
