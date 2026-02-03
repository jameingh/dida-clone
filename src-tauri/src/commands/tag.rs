use crate::db::TagRepository;
use crate::error::Result;
use crate::models::Tag;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn create_tag(name: String, color: String, state: State<'_, AppState>) -> Result<Tag> {
    let tag = Tag::new(name, color);
    TagRepository::create(&state.db, &tag)
}

#[tauri::command]
pub async fn update_tag(tag: Tag, state: State<'_, AppState>) -> Result<Tag> {
    TagRepository::update(&state.db, &tag)
}

#[tauri::command]
pub async fn get_tags(state: State<'_, AppState>) -> Result<Vec<Tag>> {
    TagRepository::get_all(&state.db)
}

#[tauri::command]
pub async fn delete_tag(tag_id: String, state: State<'_, AppState>) -> Result<()> {
    TagRepository::delete(&state.db, &tag_id)
}
