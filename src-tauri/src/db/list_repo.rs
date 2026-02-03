use crate::db::Database;
use crate::error::{AppError, Result};
use crate::models::List;
use rusqlite::params;

pub struct ListRepository;

impl ListRepository {
    pub fn create(db: &Database, list: &List) -> Result<List> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO lists (id, name, icon, color, is_smart, order_num, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                list.id,
                list.name,
                list.icon,
                list.color,
                list.is_smart as i32,
                list.order,
                list.created_at,
            ],
        )?;

        Ok(list.clone())
    }

    pub fn get_by_id(db: &Database, list_id: &str) -> Result<List> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, is_smart, order_num, created_at
             FROM lists WHERE id = ?1"
        )?;

        let list = stmt.query_row(params![list_id], |row| {
            Ok(List {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                is_smart: row.get::<_, i32>(4)? != 0,
                order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        Ok(list)
    }

    pub fn get_all(db: &Database) -> Result<Vec<List>> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, is_smart, order_num, created_at
             FROM lists ORDER BY order_num ASC, created_at ASC"
        )?;

        let lists = stmt.query_map([], |row| {
            Ok(List {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                is_smart: row.get::<_, i32>(4)? != 0,
                order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<List>>>()?;

        Ok(lists)
    }

    pub fn update(db: &Database, list: &List) -> Result<List> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute(
            "UPDATE lists SET name = ?1, icon = ?2, color = ?3, order_num = ?4 WHERE id = ?5",
            params![list.name, list.icon, list.color, list.order, list.id],
        )?;

        Ok(list.clone())
    }

    pub fn delete(db: &Database, list_id: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        let rows_affected = conn.execute("DELETE FROM lists WHERE id = ?1", params![list_id])?;
        
        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("List {} not found", list_id)));
        }

        Ok(())
    }
}
