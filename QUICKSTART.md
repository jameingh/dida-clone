# 快速启动指南

## 🚀 启动应用

### 方式 1：开发模式（推荐用于开发）
```bash
cd /Users/akm/JieYueAI/dida-clone
npm run tauri dev
```

这将：
1. 启动 Vite 开发服务器（前端）
2. 编译 Rust 后端
3. 打开应用窗口
4. 支持热重载

### 方式 2：构建生产版本
```bash
cd /Users/akm/JieYueAI/dida-clone
npm run tauri build
```

构建产物位于：`src-tauri/target/release/bundle/`

---

## 📋 首次使用

1. **启动应用**：运行 `npm run tauri dev`
2. **查看智能清单**：左侧边栏显示5个默认清单
   - 📥 收集箱
   - 📅 今天
   - 📆 最近7天
   - 📋 所有任务
   - ✅ 已完成
3. **添加任务**：在底部输入框输入任务标题，按回车
4. **完成任务**：点击任务前的圆圈
5. **查看详情**：点击任务查看右侧详情面板

---

## 🔧 故障排除

### 问题：npm run tauri dev 失败

**解决方案 1：检查 Rust 安装**
```bash
rustc --version
# 应该显示：rustc 1.91.0 或更高版本
```

如果未安装 Rust：
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**解决方案 2：清理并重新安装**
```bash
cd /Users/akm/JieYueAI/dida-clone
rm -rf node_modules
npm install
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

### 问题：前端编译错误

**解决方案：重新安装依赖**
```bash
npm install -D @tailwindcss/postcss tailwindcss postcss autoprefixer
npm install @tanstack/react-query zustand date-fns lucide-react
```

### 问题：数据库错误

数据库文件位置：
- macOS: `~/Library/Application Support/com.akm.dida-clone/dida.db`

如果需要重置数据库，删除该文件后重启应用。

---

## 📊 开发工具

### 查看数据库
```bash
# 安装 SQLite（如果未安装）
brew install sqlite

# 打开数据库
sqlite3 ~/Library/Application\ Support/com.akm.dida-clone/dida.db

# 查看表
.tables

# 查看任务
SELECT * FROM tasks;

# 查看清单
SELECT * FROM lists;

# 退出
.quit
```

### 查看日志
应用日志会输出到终端，运行 `npm run tauri dev` 时可以看到。

---

## 🎯 快速测试

### 测试任务管理
1. 启动应用
2. 选择"收集箱"清单
3. 添加几个测试任务
4. 点击圆圈标记任务完成
5. 点击任务查看详情

### 测试清单切换
1. 点击左侧不同的清单
2. 观察任务列表的变化
3. 切换到"已完成"查看完成的任务

---

## 📝 开发建议

### 修改代码后
- **前端修改**：保存后自动热重载
- **后端修改**：需要重启应用（Ctrl+C 然后重新运行）

### 推荐的开发流程
1. 修改前端代码（src/）
2. 保存并查看效果
3. 修改后端代码（src-tauri/src/）
4. 重启应用测试

---

## 🐛 已知问题

1. **任务创建**：当前只能输入标题，完整表单待实现
2. **智能清单**：过滤逻辑待实现（显示所有任务）
3. **搜索功能**：UI 已有但功能待实现

---

## 📞 获取帮助

- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构设计
- 查看 [TODO.md](./TODO.md) 了解开发进度
- 查看 [README.md](./README.md) 了解项目概况

---

**祝你使用愉快！** 🎉
