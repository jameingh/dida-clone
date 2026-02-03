use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: i64,
}

impl Tag {
    pub fn new(name: String, color: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            color,
            created_at: chrono::Utc::now().timestamp(),
        }
    }
}
