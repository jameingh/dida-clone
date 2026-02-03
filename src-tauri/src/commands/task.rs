use crate::db::TaskRepository;
use crate::error::Result;
use crate::models::Task;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn update_task_orders(orders: Vec<(String, i32)>, state: State<'_, AppState>) -> Result<()> {
    TaskRepository::update_orders(&state.db, orders)
}

#[tauri::command]
pub async fn create_task(task: Task, state: State<'_, AppState>) -> Result<Task> {
    TaskRepository::create(&state.db, &task)
}

#[tauri::command]
pub async fn create_task_simple(title: String, list_id: String, state: State<'_, AppState>) -> Result<Task> {
    let task = Task::new(title, list_id);
    TaskRepository::create(&state.db, &task)
}

#[tauri::command]
pub async fn get_subtasks(parent_id: String, state: State<'_, AppState>) -> Result<Vec<Task>> {
    TaskRepository::get_by_parent(&state.db, &parent_id)
}

#[tauri::command]
pub async fn create_subtask_simple(title: String, parent_id: String, list_id: String, state: State<'_, AppState>) -> Result<Task> {
    let mut task = Task::new(title, list_id);
    task.parent_id = Some(parent_id);
    TaskRepository::create(&state.db, &task)
}

#[tauri::command]
pub async fn get_tasks_by_tag(tag_id: String, state: State<'_, AppState>) -> Result<Vec<Task>> {
    TaskRepository::get_by_tag(&state.db, &tag_id)
}

#[tauri::command]
pub async fn get_tasks(list_id: Option<String>, state: State<'_, AppState>) -> Result<Vec<Task>> {
    match list_id {
        Some(id) => TaskRepository::get_by_list(&state.db, &id),
        None => TaskRepository::get_all(&state.db),
    }
}

#[tauri::command]
pub async fn get_task(task_id: String, state: State<'_, AppState>) -> Result<Task> {
    TaskRepository::get_by_id(&state.db, &task_id)
}

#[tauri::command]
pub async fn update_task(task: Task, state: State<'_, AppState>) -> Result<Task> {
    TaskRepository::update(&state.db, &task)
}

#[tauri::command]
pub async fn delete_task(task_id: String, state: State<'_, AppState>) -> Result<()> {
    TaskRepository::delete(&state.db, &task_id)
}

#[tauri::command]
pub async fn toggle_task(task_id: String, state: State<'_, AppState>) -> Result<Task> {
    let mut task = TaskRepository::get_by_id(&state.db, &task_id)?;
    task.toggle_completed();
    TaskRepository::update(&state.db, &task)
}
