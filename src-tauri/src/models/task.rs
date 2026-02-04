use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub list_id: String,
    pub completed: bool,
    pub priority: Priority,
    pub due_date: Option<i64>,
    pub reminder: Option<i64>,
    pub tags: Vec<String>,
    pub parent_id: Option<String>,
    pub order: i32,
    pub is_deleted: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Priority {
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
}

impl Priority {
    pub fn from_i32(value: i32) -> Self {
        match value {
            1 => Priority::Low,
            2 => Priority::Medium,
            3 => Priority::High,
            _ => Priority::None,
        }
    }

    pub fn to_i32(self) -> i32 {
        self as i32
    }
}

impl Task {
    pub fn new(title: String, list_id: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description: String::new(),
            list_id,
            completed: false,
            priority: Priority::None,
            due_date: None,
            reminder: None,
            tags: Vec::new(),
            parent_id: None,
            order: 0,
            is_deleted: false,
            created_at: now,
            updated_at: now,
            completed_at: None,
        }
    }

    pub fn toggle_completed(&mut self) {
        self.completed = !self.completed;
        self.updated_at = chrono::Utc::now().timestamp();
        if self.completed {
            self.completed_at = Some(self.updated_at);
        } else {
            self.completed_at = None;
        }
    }
}
