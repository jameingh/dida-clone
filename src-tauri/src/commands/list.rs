use crate::db::ListRepository;
use crate::error::Result;
use crate::models::List;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn create_list(list: List, state: State<'_, AppState>) -> Result<List> {
    ListRepository::create(&state.db, &list)
}

#[tauri::command]
pub async fn get_lists(state: State<'_, AppState>) -> Result<Vec<List>> {
    ListRepository::get_all(&state.db)
}

#[tauri::command]
pub async fn get_list(list_id: String, state: State<'_, AppState>) -> Result<List> {
    ListRepository::get_by_id(&state.db, &list_id)
}

#[tauri::command]
pub async fn update_list(list: List, state: State<'_, AppState>) -> Result<List> {
    ListRepository::update(&state.db, &list)
}

#[tauri::command]
pub async fn delete_list(list_id: String, state: State<'_, AppState>) -> Result<()> {
    ListRepository::delete(&state.db, &list_id)
}
