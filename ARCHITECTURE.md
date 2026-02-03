# 滴答清单克隆 - 应用架构设计

## 1. 核心功能模块

### 1.1 任务管理 (Task Management)
- 创建、编辑、删除任务
- 标记任务完成/未完成
- 任务排序（手动、按时间、按优先级）
- 子任务支持
- 任务备注

### 1.2 清单管理 (List Management)
- 默认清单：收集箱
- 自定义清单
- 智能清单：
  - 今天
  - 最近7天
  - 所有任务
  - 已完成

### 1.3 任务属性
- 标题（必填）
- 描述/备注
- 截止日期
- 提醒时间
- 优先级（无、低、中、高）
- 标签
- 子任务列表
- 重复规则（每天、每周、每月等）

### 1.4 其他功能
- 搜索和过滤
- 快捷键支持
- 数据持久化
- 主题切换（浅色/深色）

## 2. 数据模型

### 2.1 Task (任务)
```rust
pub struct Task {
    pub id: String,              // UUID
    pub title: String,           // 任务标题
    pub description: String,     // 任务描述
    pub list_id: String,         // 所属清单ID
    pub completed: bool,         // 是否完成
    pub priority: Priority,      // 优先级
    pub due_date: Option<i64>,   // 截止日期 (timestamp)
    pub reminder: Option<i64>,   // 提醒时间 (timestamp)
    pub tags: Vec<String>,       // 标签列表
    pub parent_id: Option<String>, // 父任务ID（用于子任务）
    pub order: i32,              // 排序顺序
    pub created_at: i64,         // 创建时间
    pub updated_at: i64,         // 更新时间
    pub completed_at: Option<i64>, // 完成时间
}

pub enum Priority {
    None,
    Low,
    Medium,
    High,
}
```

### 2.2 List (清单)
```rust
pub struct List {
    pub id: String,              // UUID
    pub name: String,            // 清单名称
    pub icon: String,            // 图标
    pub color: String,           // 颜色
    pub is_smart: bool,          // 是否为智能清单
    pub order: i32,              // 排序顺序
    pub created_at: i64,         // 创建时间
}

pub enum SmartListType {
    Inbox,      // 收集箱
    Today,      // 今天
    Week,       // 最近7天
    All,        // 所有任务
    Completed,  // 已完成
}
```

### 2.3 Tag (标签)
```rust
pub struct Tag {
    pub id: String,              // UUID
    pub name: String,            // 标签名称
    pub color: String,           // 颜色
    pub created_at: i64,         // 创建时间
}
```

## 3. 技术栈

### 3.1 后端 (Rust)
- **Tauri**: 应用框架
- **serde**: 序列化/反序列化
- **serde_json**: JSON 处理
- **uuid**: 生成唯一ID
- **chrono**: 时间处理
- **rusqlite**: SQLite 数据库
- **tokio**: 异步运行时

### 3.2 前端 (React + TypeScript)
- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **React Query**: 数据管理
- **Zustand**: 状态管理
- **date-fns**: 日期处理
- **React DnD**: 拖拽排序
- **React Hot Keys**: 快捷键

## 4. 项目结构

```
dida-clone/
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs            # 入口文件
│   │   ├── commands/          # Tauri 命令
│   │   │   ├── mod.rs
│   │   │   ├── task.rs        # 任务相关命令
│   │   │   ├── list.rs        # 清单相关命令
│   │   │   └── tag.rs         # 标签相关命令
│   │   ├── models/            # 数据模型
│   │   │   ├── mod.rs
│   │   │   ├── task.rs
│   │   │   ├── list.rs
│   │   │   └── tag.rs
│   │   ├── db/                # 数据库
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs  # 数据库连接
│   │   │   ├── task_repo.rs   # 任务仓储
│   │   │   ├── list_repo.rs   # 清单仓储
│   │   │   └── tag_repo.rs    # 标签仓储
│   │   ├── state.rs           # 应用状态
│   │   └── error.rs           # 错误处理
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                        # React 前端
│   ├── components/            # UI 组件
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx    # 侧边栏
│   │   │   ├── Header.tsx     # 顶部栏
│   │   │   └── MainLayout.tsx # 主布局
│   │   ├── Task/
│   │   │   ├── TaskList.tsx   # 任务列表
│   │   │   ├── TaskItem.tsx   # 任务项
│   │   │   ├── TaskDetail.tsx # 任务详情
│   │   │   └── TaskForm.tsx   # 任务表单
│   │   ├── List/
│   │   │   ├── ListItem.tsx   # 清单项
│   │   │   └── ListForm.tsx   # 清单表单
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── DatePicker.tsx
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useTasks.ts
│   │   ├── useLists.ts
│   │   ├── useTags.ts
│   │   └── useKeyboard.ts
│   ├── services/              # API 服务层
│   │   ├── task.ts
│   │   ├── list.ts
│   │   └── tag.ts
│   ├── store/                 # 状态管理
│   │   ├── useAppStore.ts
│   │   └── types.ts
│   ├── types/                 # TypeScript 类型
│   │   ├── task.ts
│   │   ├── list.ts
│   │   └── tag.ts
│   ├── utils/                 # 工具函数
│   │   ├── date.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
└── README.md
```

## 5. IPC 通信接口

### 5.1 任务相关命令
```rust
// 创建任务
#[tauri::command]
async fn create_task(task: Task, state: State<AppState>) -> Result<Task, String>

// 获取任务列表
#[tauri::command]
async fn get_tasks(list_id: Option<String>, state: State<AppState>) -> Result<Vec<Task>, String>

// 更新任务
#[tauri::command]
async fn update_task(task: Task, state: State<AppState>) -> Result<Task, String>

// 删除任务
#[tauri::command]
async fn delete_task(task_id: String, state: State<AppState>) -> Result<(), String>

// 切换任务完成状态
#[tauri::command]
async fn toggle_task(task_id: String, state: State<AppState>) -> Result<Task, String>
```

### 5.2 清单相关命令
```rust
// 创建清单
#[tauri::command]
async fn create_list(list: List, state: State<AppState>) -> Result<List, String>

// 获取所有清单
#[tauri::command]
async fn get_lists(state: State<AppState>) -> Result<Vec<List>, String>

// 更新清单
#[tauri::command]
async fn update_list(list: List, state: State<AppState>) -> Result<List, String>

// 删除清单
#[tauri::command]
async fn delete_list(list_id: String, state: State<AppState>) -> Result<(), String>
```

### 5.3 标签相关命令
```rust
// 创建标签
#[tauri::command]
async fn create_tag(tag: Tag, state: State<AppState>) -> Result<Tag, String>

// 获取所有标签
#[tauri::command]
async fn get_tags(state: State<AppState>) -> Result<Vec<Tag>, String>

// 删除标签
#[tauri::command]
async fn delete_tag(tag_id: String, state: State<AppState>) -> Result<(), String>
```

## 6. 数据库设计

### 6.1 SQLite Schema
```sql
-- 任务表
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    list_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    due_date INTEGER,
    reminder INTEGER,
    parent_id TEXT,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 清单表
CREATE TABLE lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_smart INTEGER NOT NULL DEFAULT 0,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- 标签表
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 任务标签关联表
CREATE TABLE task_tags (
    task_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

## 7. UI 布局设计

```
┌─────────────────────────────────────────────────────────────┐
│  Header (搜索框、设置、用户)                                   │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│ Sidebar  │     Task List                │   Task Detail     │
│          │                              │                   │
│ - 收集箱  │  ☐ Task 1                    │  标题: Task 1     │
│ - 今天    │  ☐ Task 2                    │  描述: ...        │
│ - 最近7天 │  ☑ Task 3 (completed)        │  截止: 2026-02-05 │
│          │  ☐ Task 4                    │  优先级: 高       │
│ 我的清单  │                              │  标签: work       │
│ - 工作    │  + 添加任务                   │  子任务:          │
│ - 个人    │                              │  ☐ Subtask 1      │
│ - 学习    │                              │  ☐ Subtask 2      │
│          │                              │                   │
│ + 新建清单│                              │                   │
│          │                              │                   │
└──────────┴──────────────────────────────┴───────────────────┘
```

## 8. 开发阶段

### Phase 1: 基础架构 ✓
- [x] 初始化 Tauri 项目
- [x] 设计数据模型
- [x] 设计架构文档

### Phase 2: 后端开发
- [ ] 实现数据库连接和初始化
- [ ] 实现任务 CRUD 操作
- [ ] 实现清单 CRUD 操作
- [ ] 实现标签 CRUD 操作
- [ ] 实现智能清单逻辑

### Phase 3: 前端开发
- [ ] 实现基础布局（Sidebar、Header、MainLayout）
- [ ] 实现任务列表组件
- [ ] 实现任务详情组件
- [ ] 实现任务表单
- [ ] 实现清单管理
- [ ] 实现搜索和过滤

### Phase 4: 功能增强
- [ ] 实现拖拽排序
- [ ] 实现快捷键
- [ ] 实现主题切换
- [ ] 实现数据导入导出

### Phase 5: 测试和优化
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] macOS 平台适配

## 9. 快捷键设计

- `Cmd + N`: 新建任务
- `Cmd + Shift + N`: 新建清单
- `Cmd + F`: 搜索
- `Cmd + K`: 快速跳转
- `Cmd + /`: 显示快捷键帮助
- `Space`: 切换任务完成状态
- `Enter`: 编辑任务
- `Delete`: 删除任务
- `Cmd + 1-9`: 切换清单

## 10. 性能优化策略

1. **虚拟滚动**: 任务列表使用虚拟滚动，支持大量任务
2. **懒加载**: 任务详情按需加载
3. **数据缓存**: 使用 React Query 缓存数据
4. **批量操作**: 支持批量更新和删除
5. **索引优化**: 数据库查询使用索引
6. **防抖节流**: 搜索和输入使用防抖
