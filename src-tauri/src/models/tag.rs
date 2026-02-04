use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
    pub parent_id: Option<String>,
    pub is_pinned: bool,
    pub created_at: i64,
}

impl Tag {
    pub fn new(name: String, color: String, parent_id: Option<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            color,
            parent_id,
            is_pinned: false,
            created_at: chrono::Utc::now().timestamp(),
        }
    }
}
