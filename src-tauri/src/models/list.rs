use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct List {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub is_smart: bool,
    pub order: i32,
    pub created_at: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum SmartListType {
    Inbox,
    Today,
    Week,
    All,
    Completed,
}

impl List {
    pub fn new(name: String, icon: String, color: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            icon,
            color,
            is_smart: false,
            order: 0,
            created_at: chrono::Utc::now().timestamp(),
        }
    }

    pub fn new_smart(list_type: SmartListType) -> Self {
        let (name, icon) = match list_type {
            SmartListType::Inbox => ("收集箱".to_string(), "📥".to_string()),
            SmartListType::Today => ("今天".to_string(), "📅".to_string()),
            SmartListType::Week => ("最近7天".to_string(), "📆".to_string()),
            SmartListType::All => ("所有任务".to_string(), "📋".to_string()),
            SmartListType::Completed => ("已完成".to_string(), "✅".to_string()),
        };

        Self {
            id: format!("smart_{:?}", list_type).to_lowercase(),
            name,
            icon,
            color: "#3B82F6".to_string(),
            is_smart: true,
            order: 0,
            created_at: chrono::Utc::now().timestamp(),
        }
    }
}
