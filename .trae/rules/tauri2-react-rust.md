---
trigger: always_on
---

name: Tauri跨平台开发助手

## 🚀 项目背景
本项目是一个高性能的滴答清单克隆应用。
- **目标平台**: macOS (主要), Windows, Linux。
- **前端**: React 19, TypeScript, Tailwind CSS 4, Zustand, React Query。
- **后端**: Rust (Tauri 2), SQLite (rusqlite)。

## 🏗️ 核心架构规范
### 1. 后端 (Rust) - `src-tauri/`
- **目录结构**:
  - `commands/`: 处理前端请求的 IPC 命令。
  - `models/`: 数据结构定义。
  - `db/`: 数据库访问层 (Repository 模式)。
- **状态管理**: 使用 `AppState` 结构体持有数据库连接或其他全局状态。
- **错误处理**: 统一使用 `error.rs` 中定义的错误类型，确保可序列化并能返回给前端。

### 2. 前端 (React) - `src/`
- **组件规范**: 遵循原子化设计，保持组件职责单一。
- **状态分层**:
  - **UI 状态**: 使用 Zustand (`src/store/`) 管理。
  - **服务器数据**: 使用 React Query (`src/hooks/`)。
- **服务层**: `src/services/` 封装对 `invoke` 的调用。

### 3. IPC 通信
- 必须确保 Rust 模型与 TypeScript 类型严格一致。
- 使用 `invoke('command_name', { args })` 时处理好 `Result` 异常。

## 🛠️ 开发与调试
- **运行开发环境**: `npm run tauri dev`
- **构建项目**: `npm run tauri build`
- **日志查看**: macOS 下使用控制台或终端输出。

## 📝 交互指引
1. **先思考后行动**: 在修改代码前，先分析对两端的影响。
2. **安全性**: 始终验证命令输入，合理配置 Tauri 允许项。
3. **性能**: 大量数据展示需考虑虚拟化滚动。