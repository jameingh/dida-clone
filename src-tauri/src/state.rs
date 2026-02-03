use crate::db::Database;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            db: Arc::new(db),
        }
    }
}
