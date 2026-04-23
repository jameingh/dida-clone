# Database Layer

**Scope:** `src-tauri/src/db/` - SQLite repository pattern

## OVERVIEW

Repository pattern for SQLite data access. Async queries with `sqlx` + `tokio`.

## STRUCTURE

```
db/
├── connection.rs   # Pool initialization, migrations
├── task_repo.rs    # 14KB - largest file (split recommended)
├── list_repo.rs    # List CRUD operations
├── tag_repo.rs     # Tag CRUD operations
└── mod.rs          # Module exports
```

## WHERE TO LOOK

| Operation | File | Key Functions |
|-----------|------|---------------|
| Task CRUD | `task_repo.rs` | `create`, `get_by_id`, `update`, `delete`, `toggle_complete` |
| List CRUD | `list_repo.rs` | `create`, `get_all`, `update`, `delete` |
| Tag CRUD | `tag_repo.rs` | `create`, `get_all`, `delete`, `attach_to_task` |
| Pool setup | `connection.rs` | `init_pool`, `run_migrations` |

## CONVENTIONS

### Repository Structure
```rust
pub struct TaskRepo {
    pool: SqlitePool,
}

impl TaskRepo {
    pub fn new(pool: SqlitePool) -> Self { ... }

    pub async fn create(&self, task: Task) -> Result<Task, AppError> {
        let sql = "INSERT INTO tasks ... RETURNING *";
        sqlx::query_as(sql)
            .bind(&task.title)
            .fetch_one(&self.pool)
            .await
            .map_err(AppError::from)
    }
}
```

### SQL Queries
- Use `sqlx::query_as` for type-safe queries
- Use `?` for error propagation
- Use `bind()` for parameter binding (no string concat)
- Always order by `order_num` for list queries

### Connection Pool
```rust
// AppState setup
let pool = SqlitePool::connect(&db_url).await?;
AppState { pool }
```

## ANTI-PATTERNS

- **NEVER** use raw string SQL without parameters - always bind
- **NEVER** leave connections unclosed - use `sqlx` pool (auto-managed)
- **DO NOT** mix sync/async DB calls - always use `.await`
- **AVOID** N+1 queries - use JOINs for related data
- **AVOID** raw SQL injection - use `bind()` everywhere

## NOTES

### Database Schema
See tables: `tasks`, `lists`, `tags`, `task_tags` with indexes on `list_id`, `parent_id`, `due_date`

### Migrations
Current: Single migration in `connection.rs` creating all tables. Consider moving to `migrations/` folder for version control.

### File Size Warning
`task_repo.rs` is 14KB - split trait recommended:
```rust
// Split by operation type
mod task_repo {
    mod create { ... }
    mod read { ... }
    mod update { ... }
    mod delete { ... }
}
```

### Testing Considerations
- Use in-memory SQLite for unit tests: `sqlite::memory:`
- Integration tests should use temp file database
- Clean up test data between tests
