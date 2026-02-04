use crate::db::Database;
use crate::error::{AppError, Result};
use crate::models::Tag;
use rusqlite::params;

pub struct TagRepository;

impl TagRepository {
    pub fn create(db: &Database, tag: &Tag) -> Result<Tag> {
        let conn = db.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO tags (id, name, color, parent_id, is_pinned, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![tag.id, tag.name, tag.color, tag.parent_id, if tag.is_pinned { 1 } else { 0 }, tag.created_at],
        )?;

        Ok(tag.clone())
    }

    pub fn get_by_id(db: &Database, tag_id: &str) -> Result<Tag> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, color, parent_id, is_pinned, created_at FROM tags WHERE id = ?1"
        )?;

        let tag = stmt.query_row(params![tag_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                parent_id: row.get(3)?,
                is_pinned: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
            })
        })?;

        Ok(tag)
    }

    pub fn get_all(db: &Database) -> Result<Vec<Tag>> {
        let conn = db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, color, parent_id, is_pinned, created_at FROM tags ORDER BY name ASC"
        )?;

        let tags = stmt.query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                parent_id: row.get(3)?,
                is_pinned: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<Tag>>>()?;

        Ok(tags)
    }

    pub fn update(db: &Database, tag: &Tag) -> Result<Tag> {
        let conn = db.conn.lock().unwrap();
        
        let rows_affected = conn.execute(
            "UPDATE tags SET name = ?1, color = ?2, parent_id = ?3, is_pinned = ?4 WHERE id = ?5",
            params![tag.name, tag.color, tag.parent_id, if tag.is_pinned { 1 } else { 0 }, tag.id],
        )?;

        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("Tag {} not found", tag.id)));
        }

        Ok(tag.clone())
    }

    pub fn delete(db: &Database, tag_id: &str) -> Result<()> {
        let conn = db.conn.lock().unwrap();
        
        let rows_affected = conn.execute("DELETE FROM tags WHERE id = ?1", params![tag_id])?;
        
        if rows_affected == 0 {
            return Err(AppError::NotFound(format!("Tag {} not found", tag_id)));
        }

        Ok(())
    }
}
