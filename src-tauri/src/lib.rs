pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod state;

use crate::{db::Database, state::AppState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            
            // 确保目录存在
            std::fs::create_dir_all(&app_data_dir)?;
            
            // 初始化数据库
            let db_path = app_data_dir.join("dida.db");
            let db = Database::new(db_path).expect("Failed to initialize database");
            
            // 初始化默认数据
            init_default_data(&db)?;
            
            // 设置应用状态
            let state = AppState::new(db);
            app.manage(state);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 任务命令
            commands::task::update_task_orders,
            commands::task::create_task,
            commands::task::create_task_simple,
            commands::task::get_subtasks,
            commands::task::create_subtask_simple,
            commands::task::get_tasks_by_tag,
            commands::task::get_tasks,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::delete_task,
            commands::task::toggle_task,
            // 清单命令
            commands::list::create_list,
            commands::list::get_lists,
            commands::list::get_list,
            commands::list::update_list,
            commands::list::delete_list,
            // 标签命令
            commands::tag::create_tag,
            commands::tag::update_tag,
            commands::tag::get_tags,
            commands::tag::delete_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_default_data(db: &Database) -> Result<(), Box<dyn std::error::Error>> {
    use crate::db::ListRepository;
    use crate::models::SmartListType;
    
    // 检查是否已有清单
    let lists = ListRepository::get_all(db)?;
    if !lists.is_empty() {
        return Ok(());
    }
    
    // 创建默认智能清单
    let smart_lists = vec![
        models::List::new_smart(SmartListType::Inbox),
        models::List::new_smart(SmartListType::Today),
        models::List::new_smart(SmartListType::Week),
        models::List::new_smart(SmartListType::All),
        models::List::new_smart(SmartListType::Completed),
    ];
    
    for (index, mut list) in smart_lists.into_iter().enumerate() {
        list.order = index as i32;
        ListRepository::create(db, &list)?;
    }
    
    Ok(())
}
