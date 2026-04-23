# Rust Backend

**Scope:** `src-tauri/src/` - Tauri 2 + Rust backend with SQLite

## OVERVIEW

Repository-pattern backend with IPC commands, SQLite persistence, Tokio async runtime.

## STRUCTURE

```
src-tauri/src/
├── lib.rs              # Tauri Builder, plugin setup, command registration
├── main.rs             # Binary entry → lib::run()
├── state.rs            # AppState (db connection pool)
├── error.rs            # Unified error type (thiserror)
├── commands/           # IPC endpoints
│   ├── task.rs         # 6 task commands
│   ├── list.rs         # 5 list commands
│   └── tag.rs          # 3 tag commands
├── db/                 # Repository layer
│   ├── connection.rs   # SQLite pool init
│   ├── task_repo.rs    # 14KB (largest file)
│   ├── list_repo.rs
│   └── tag_repo.rs
└── models/             # Data structs
    ├── task.rs
    ├── list.rs
    └── tag.rs
```

## WHERE TO LOOK

| Add This | Location | File |
|----------|----------|------|
| New IPC command | `commands/` | `task.rs`, `list.rs`, or `tag.rs` |
| DB query | `db/` | `*_repo.rs` |
| Data struct | `models/` | Matching entity |
| App state | `state.rs` | AppState struct |
| Error variant | `error.rs` | AppError enum |

## CONVENTIONS

### Command Pattern
```rust
#[tauri::command]
async fn create_task(task: Task, state: State<'_, AppState>) -> Result<Task, String> {
    task_repo.create(task).await.map_err(|e| e.to_string())
}
```

### Repository Pattern
```rust
pub struct TaskRepo {
    pool: SqlitePool,
}

impl TaskRepo {
    pub async fn create(&self, task: Task) -> Result<Task> {
        // SQL query here
    }
}
```

### Error Handling
- Use `thiserror` for AppError enum
- Serialize errors to frontend via `serde::Serialize`
- Never panic - return `Result<T, AppError>`

### Type Sync with Frontend
Rust struct fields (snake_case) → TypeScript interface (camelCase):
```rust
// Rust
pub struct Task {
    pub id: String,
    pub parent_id: Option<String>,
    pub due_date: Option<i64>,
    pub created_at: i64,
}
```
```typescript
// TypeScript
interface Task {
  id: string;
  parentId: string | null;
  dueDate: number | null;
  createdAt: number;
}
```

## ANTI-PATTERNS

- **NEVER** add logic to `main.rs` - use `lib.rs::run()`
- **NEVER** expose raw SQLite errors to frontend - wrap in AppError
- **DO NOT** skip `#[tauri::command]` attribute on IPC handlers
- **AVOID** blocking operations in async context - use `spawn_blocking` for CPU-intensive work
- **AVOID** cloning large data structs - use references

## NOTES

### Tokio Runtime
- Async commands use Tokio runtime
- Use `#[tokio::main]` in tests
- `spawn_blocking` for file I/O in synchronous contexts

### SQLite Pool
- Connection pool in `AppState`
- Pool size configured in `connection.rs`
- Always use prepared statements (no raw SQL injection)

### Database Location
macOS: `~/Library/Application Support/com.akm.dida-clone/dida.db`

### Tech Debt
- `task_repo.rs` (14KB) - consider splitting by CRUD operation
