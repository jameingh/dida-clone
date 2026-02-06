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
pub async fn create_task_extended(
    title: String,
    list_id: String,
    due_date: Option<i64>,
    reminder: Option<String>,
    priority: Option<i32>,
    tags: Vec<String>,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<Task> {
    let mut task = Task::new(title, list_id);
    task.due_date = due_date;
    task.reminder = reminder;
    if let Some(p) = priority {
        task.priority = crate::models::Priority::from_i32(p);
    }
    task.tags = tags;
    task.description = description.unwrap_or_default();
    TaskRepository::create(&state.db, &task)
}

#[tauri::command]
pub async fn get_subtasks(parent_id: String, state: State<'_, AppState>) -> Result<Vec<Task>> {
    TaskRepository::get_by_parent(&state.db, &parent_id)
}

#[tauri::command]
pub async fn create_subtask_simple(title: String, parent_id: String, list_id: String, state: State<'_, AppState>) -> Result<Task> {
    let parent_task = TaskRepository::get_by_id(&state.db, &parent_id)?;
    let mut task = Task::new(title, list_id);
    task.parent_id = Some(parent_id);
    task.due_date = parent_task.due_date;
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
pub async fn undo_delete_task(task_id: String, state: State<'_, AppState>) -> Result<()> {
    TaskRepository::undo_delete(&state.db, &task_id)
}

#[tauri::command]
pub async fn delete_task_permanently(task_id: String, state: State<'_, AppState>) -> Result<()> {
    TaskRepository::delete_permanently(&state.db, &task_id)
}

#[tauri::command]
pub async fn empty_trash(state: State<'_, AppState>) -> Result<()> {
    TaskRepository::empty_trash(&state.db)
}

#[tauri::command]
pub async fn toggle_task(task_id: String, state: State<'_, AppState>) -> Result<Task> {
    let mut task = TaskRepository::get_by_id(&state.db, &task_id)?;
    task.toggle_completed();
    let updated_task = TaskRepository::update(&state.db, &task)?;

    // 如果父任务被完成，则同步完成所有未完成的子任务
    if updated_task.completed {
        let subtasks = TaskRepository::get_by_parent(&state.db, &task_id)?;
        for mut subtask in subtasks {
            if !subtask.completed {
                subtask.completed = true;
                subtask.completed_at = updated_task.completed_at;
                subtask.updated_at = updated_task.updated_at;
                TaskRepository::update(&state.db, &subtask)?;
            }
        }
    }

    Ok(updated_task)
}
