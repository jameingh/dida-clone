use crate::db::Database;
use crate::error::{AppError, Result};
use crate::models::{Priority, Task};
use rusqlite::params;

pub struct TaskRepository;

impl TaskRepository {
    pub fn create(db: &Database, task: &Task) -> Result<Task> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO tasks (id, title, description, list_id, completed, priority, 
             due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                task.id,
                task.title,
                task.description,
                task.list_id,
                task.completed as i32,
                task.priority.to_i32(),
                task.due_date,
                task.reminder,
                task.parent_id,
                task.order,
                task.is_deleted as i32,
                task.created_at,
                task.updated_at,
                task.completed_at,
            ],
        )?;

        // 插入标签关联
        for tag_id in &task.tags {
            conn.execute(
                "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1, ?2)",
                params![task.id, tag_id],
            )?;
        }

        // 重新加载标签，确保返回的 Task 包含真实有效的标签 ID
        let tags = Self::get_task_tags(&conn, &task.id)?;
        Ok(Task { tags, ..task.clone() })
    }

    pub fn get_by_id(db: &Database, task_id: &str) -> Result<Task> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, title, description, list_id, completed, priority, 
             due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
             FROM tasks WHERE id = ?1"
        )?;

        let task = stmt.query_row(params![task_id], Self::map_row)?;

        // 加载标签
        let tags = Self::get_task_tags(&conn, task_id)?;
        Ok(Task { tags, ..task })
    }

    pub fn get_all(db: &Database) -> Result<Vec<Task>> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, title, description, list_id, completed, priority, 
             due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
             FROM tasks WHERE is_deleted = 0 ORDER BY order_num ASC, created_at DESC"
        )?;

        let tasks = stmt.query_map([], Self::map_row)?
            .collect::<rusqlite::Result<Vec<Task>>>()?;

        // 为每个任务加载标签
        let mut tasks_with_tags = Vec::new();
        for task in tasks {
            let tags = Self::get_task_tags(&conn, &task.id)?;
            tasks_with_tags.push(Task { tags, ..task });
        }

        Ok(tasks_with_tags)
    }

    pub fn get_by_list(db: &Database, list_id: &str) -> Result<Vec<Task>> {
        let conn = db.conn.lock().unwrap();
        
        let (query, has_params) = match list_id {
            "smart_trash" => (
                "SELECT id, title, description, list_id, completed, priority, 
                 due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                 FROM tasks WHERE is_deleted = 1 ORDER BY updated_at DESC",
                false
            ),
            "smart_completed" => (
                "SELECT id, title, description, list_id, completed, priority, 
                 due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                 FROM tasks WHERE completed = 1 AND is_deleted = 0 ORDER BY completed_at DESC, updated_at DESC",
                false
            ),
            "smart_all" => (
                "SELECT id, title, description, list_id, completed, priority, 
                 due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                 FROM tasks WHERE is_deleted = 0 ORDER BY order_num ASC, created_at DESC",
                false
            ),
            "smart_today" => {
                let now = chrono::Local::now();
                let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_local_timezone(chrono::Local).unwrap().timestamp();
                let today_end = now.date_naive().and_hms_opt(23, 59, 59).unwrap().and_local_timezone(chrono::Local).unwrap().timestamp();
                
                let mut stmt = conn.prepare(
                    "SELECT id, title, description, list_id, completed, priority, 
                     due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                     FROM tasks 
                     WHERE (due_date <= ?1 AND is_deleted = 0 AND completed = 0)
                        OR (completed_at >= ?2 AND completed_at <= ?1 AND is_deleted = 0 AND completed = 1)
                     ORDER BY completed ASC, due_date ASC, priority DESC"
                )?;
                
                let tasks = stmt.query_map(params![today_end, today_start], Self::map_row)?
                    .collect::<rusqlite::Result<Vec<Task>>>()?;
                
                let mut tasks_with_tags = Vec::new();
                for task in tasks {
                    let tags = Self::get_task_tags(&conn, &task.id)?;
                    tasks_with_tags.push(Task { tags, ..task });
                }
                return Ok(tasks_with_tags);
            },
            "smart_week" => {
                let now = chrono::Local::now();
                let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_local_timezone(chrono::Local).unwrap().timestamp();
                let week_end = (now + chrono::Duration::days(7)).date_naive().and_hms_opt(23, 59, 59).unwrap().and_local_timezone(chrono::Local).unwrap().timestamp();
                
                let mut stmt = conn.prepare(
                    "SELECT id, title, description, list_id, completed, priority, 
                     due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                     FROM tasks 
                     WHERE (due_date <= ?1 AND is_deleted = 0 AND completed = 0)
                        OR (completed_at >= ?2 AND completed_at <= ?1 AND is_deleted = 0 AND completed = 1)
                     ORDER BY completed ASC, due_date ASC, priority DESC"
                )?;
                
                let tasks = stmt.query_map(params![week_end, today_start], Self::map_row)?
                    .collect::<rusqlite::Result<Vec<Task>>>()?;
                
                let mut tasks_with_tags = Vec::new();
                for task in tasks {
                    let tags = Self::get_task_tags(&conn, &task.id)?;
                    tasks_with_tags.push(Task { tags, ..task });
                }
                return Ok(tasks_with_tags);
            },
            _ => (
                "SELECT id, title, description, list_id, completed, priority, 
                 due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
                 FROM tasks WHERE list_id = ?1 AND is_deleted = 0 ORDER BY order_num ASC, created_at DESC",
                true
            ),
        };

        let mut stmt = conn.prepare(query)?;

        let tasks = if has_params {
            stmt.query_map(params![list_id], Self::map_row)?
                .collect::<rusqlite::Result<Vec<Task>>>()?
        } else {
            stmt.query_map([], Self::map_row)?
                .collect::<rusqlite::Result<Vec<Task>>>()?
        };

        let mut tasks_with_tags = Vec::new();
        for task in tasks {
            let tags = Self::get_task_tags(&conn, &task.id)?;
            tasks_with_tags.push(Task { tags, ..task });
        }

        Ok(tasks_with_tags)
    }

    pub fn get_by_tag(db: &Database, tag_id: &str) -> Result<Vec<Task>> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT t.id, t.title, t.description, t.list_id, t.completed, t.priority, 
             t.due_date, t.reminder, t.parent_id, t.order_num, t.is_deleted, t.created_at, t.updated_at, t.completed_at
             FROM tasks t
             INNER JOIN task_tags tt ON t.id = tt.task_id
             WHERE tt.tag_id = ?1 AND t.is_deleted = 0
             ORDER BY t.order_num ASC, t.created_at DESC"
        )?;

        let tasks = stmt.query_map(params![tag_id], Self::map_row)?
            .collect::<rusqlite::Result<Vec<Task>>>()?;

        let mut tasks_with_tags = Vec::new();
        for task in tasks {
            let tags = Self::get_task_tags(&conn, &task.id)?;
            tasks_with_tags.push(Task { tags, ..task });
        }

        Ok(tasks_with_tags)
    }

    pub fn get_by_parent(db: &Database, parent_id: &str) -> Result<Vec<Task>> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, title, description, list_id, completed, priority, 
             due_date, reminder, parent_id, order_num, is_deleted, created_at, updated_at, completed_at
             FROM tasks WHERE parent_id = ?1 AND is_deleted = 0 ORDER BY order_num ASC, created_at DESC"
        )?;

        let tasks = stmt.query_map(params![parent_id], Self::map_row)?
            .collect::<rusqlite::Result<Vec<Task>>>()?;

        let mut tasks_with_tags = Vec::new();
        for task in tasks {
            let tags = Self::get_task_tags(&conn, &task.id)?;
            tasks_with_tags.push(Task { tags, ..task });
        }

        Ok(tasks_with_tags)
    }

    pub fn update(db: &Database, task: &Task) -> Result<Task> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute(
            "UPDATE tasks SET title = ?1, description = ?2, list_id = ?3, completed = ?4, 
             priority = ?5, due_date = ?6, reminder = ?7, parent_id = ?8, order_num = ?9, 
             is_deleted = ?10, updated_at = ?11, completed_at = ?12 WHERE id = ?13",
            params![
                task.title,
                task.description,
                task.list_id,
                task.completed as i32,
                task.priority.to_i32(),
                task.due_date,
                task.reminder,
                task.parent_id,
                task.order,
                task.is_deleted as i32,
                task.updated_at,
                task.completed_at,
                task.id,
            ],
        )?;

        // 更新标签关联
        conn.execute("DELETE FROM task_tags WHERE task_id = ?1", params![task.id])?;
        for tag_id in &task.tags {
            conn.execute(
                "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1, ?2)",
                params![task.id, tag_id],
            )?;
        }

        // 重新加载标签，确保返回的 Task 包含真实有效的标签 ID
        let tags = Self::get_task_tags(&conn, &task.id)?;
        Ok(Task { tags, ..task.clone() })
    }

    pub fn delete(db: &Database, task_id: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        let now = chrono::Utc::now().timestamp();
        let rows_affected = conn.execute(
            "UPDATE tasks SET is_deleted = 1, updated_at = ?1 WHERE id = ?2", 
            params![now, task_id]
        )?;
        
        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("Task {} not found", task_id)));
        }

        Ok(())
    }

    pub fn undo_delete(db: &Database, task_id: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        let now = chrono::Utc::now().timestamp();
        let rows_affected = conn.execute(
            "UPDATE tasks SET is_deleted = 0, updated_at = ?1 WHERE id = ?2", 
            params![now, task_id]
        )?;
        
        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("Task {} not found", task_id)));
        }

        Ok(())
    }

    pub fn delete_permanently(db: &Database, task_id: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        let rows_affected = conn.execute("DELETE FROM tasks WHERE id = ?1", params![task_id])?;
        
        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("Task {} not found", task_id)));
        }

        Ok(())
    }

    pub fn empty_trash(db: &Database) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute("DELETE FROM tasks WHERE is_deleted = 1", [])?;
        
        Ok(())
    }

    pub fn update_orders(db: &Database, orders: Vec<(String, i32)>) -> Result<()> {
        let mut conn = db.conn.lock().unwrap();
        let tx = conn.transaction()?;

        {
            let mut stmt = tx.prepare("UPDATE tasks SET order_num = ?1 WHERE id = ?2")?;
            for (id, order_num) in orders {
                stmt.execute(params![order_num, id])?;
            }
        }

        tx.commit()?;
        Ok(())
    }

    fn get_task_tags(conn: &rusqlite::Connection, task_id: &str) -> Result<Vec<String>> {
        let mut stmt = conn.prepare(
            "SELECT tt.tag_id FROM task_tags tt
             JOIN tags t ON tt.tag_id = t.id
             WHERE tt.task_id = ?1"
        )?;
        let tags = stmt.query_map(params![task_id], |row| row.get(0))?
            .collect::<rusqlite::Result<Vec<String>>>()?;
        Ok(tags)
    }

    fn map_row(row: &rusqlite::Row) -> rusqlite::Result<Task> {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            list_id: row.get(3)?,
            completed: row.get::<_, i32>(4)? != 0,
            priority: Priority::from_i32(row.get(5)?),
            due_date: row.get(6)?,
            reminder: row.get(7)?,
            parent_id: row.get(8)?,
            order: row.get(9)?,
            is_deleted: row.get::<_, i32>(10)? != 0,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
            completed_at: row.get(13)?,
            tags: Vec::new(),
        })
    }
}
