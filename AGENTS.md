# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-23
**Commit:** (see `git rev-parse --short HEAD`)
**Branch:** (see `git branch --show-current`)

## OVERVIEW

Tauri 2 + React 19 + TypeScript + Rust desktop task manager (TickTick/Didi clone). Local-first with SQLite storage.

## STRUCTURE

```
.
├── src/                    # React 19 + TypeScript frontend
│   ├── components/         # Feature-based UI components
│   ├── hooks/              # React Query + custom hooks
│   ├── services/           # Tauri IPC wrappers
│   ├── store/              # Zustand (UI state only)
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Domain-specific utilities
│   └── constants/          # Feature-segmented constants
├── src-tauri/              # Rust 1.91 + Tauri backend
│   ├── src/commands/       # IPC command handlers
│   ├── src/db/             # Repository pattern (SQLite)
│   ├── src/models/         # Rust data structs
│   └── capabilities/       # Tauri security permissions
├── index.html              # Vite HTML entry
├── package.json            # Frontend deps/scripts
└── vite.config.ts          # Vite + Tauri config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add UI component | `src/components/Task/` or `src/components/Common/` | Feature-first organization |
| Modify data fetch | `src/hooks/useTasks.ts` (7KB god hook) | React Query patterns |
| Add backend command | `src-tauri/src/commands/` | `#[tauri::command]` handlers |
| Database changes | `src-tauri/src/db/*_repo.rs` | Repository pattern |
| Type definitions | `src/types/` (TS) + `src-tauri/src/models/` (Rust) | Manual sync required |
| Tauri config | `src-tauri/tauri.conf.json` | Window, bundle, permissions |
| Dev server | `vite.config.ts` | Port 1420, HMR 1421 |
| AI assistant rules | `.agent/`, `.cursor/`, `.trae/` | Multiple AI IDE configs |

## CONVENTIONS

### TypeScript (Strict Mode)
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`
- No barrel exports - direct imports everywhere

### Rust Backend
- Repository pattern for all DB access
- `#[tauri::command]` for IPC endpoints
- Error handling via `thiserror`, serializable to frontend
- Async with Tokio runtime

### Component Organization
- Feature-based folders (`Task/`, `Tag/`, `Layout/`)
- No `pages/` - single-page app
- No `index.ts` re-exports

### IPC Communication Flow
```
Component → Hook (React Query) → Service (invoke) → Command → Repository → SQLite
```

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** call `invoke()` directly in components - always use `services/*.ts`
- **NEVER** suppress TypeScript errors with `as any` or `@ts-ignore`
- **DO NOT** modify Rust models without syncing TypeScript types in `src/types/`
- **DO NOT** use localStorage for data - always use Tauri commands (except browser debug mode)
- **AVOID** adding logic to `main.rs` - keep binary entry minimal, use `lib.rs::run()`
- **AVOID** mixing Zustand with server data - React Query only for data fetching

## UNIQUE STYLES

### Browser Fallback Mode
Services detect non-Tauri environment and fall back to `localStorage` (key: `dida-tasks`) for frontend-only debugging.

### Dual AI Configs
Project has configs for 4 AI IDEs:
- `.agent/` - Agent-specific rules
- `.cursor/` - Cursor skills
- `.trae/` - Trae rules/skills
- `.vscode/` - Standard VS Code

### Constants Segmentation
Constants split by domain (not single file):
- `constants/smartLists.ts`
- `constants/repeats.ts`
- `constants/reminders.ts`
- `constants/colors.ts`

### Domain-Specific Utilities
- `utils/date.ts` - date-fns wrappers
- `utils/priority.ts` - priority helpers
- `utils/taskGrouping.ts` - grouping logic

## COMMANDS

```bash
# Development (Tauri + Vite + Rust)
npm run tauri dev

# Build production bundle
npm run tauri build

# Frontend-only (browser debug mode)
npm run dev

# Preview production build
npm run preview
```

**Build artifacts:** `src-tauri/target/release/bundle/`

## NOTES

### Port Conventions
- Vite dev server: `1420` (fixed, `strictPort: true`)
- HMR WebSocket: `1421`
- Tauri expects these ports - do not change

### Database Location
macOS: `~/Library/Application Support/com.akm.dida-clone/dida.db`

### Tech Debt
- `useTasks.ts` (7KB) should be refactored - too large
- No barrel exports - imports are verbose
- No test infrastructure (no Jest/Vitest config)
- TypeScript/Rust type sync is manual (error-prone)

### Missing Infrastructure
- No ESLint/Prettier configs
- No test files or test utilities
- No Storybook or component docs
- No `features/` or `pages/` structure

---

**Hierarchy:**
```
./AGENTS.md (root)
├── src/AGENTS.md
│   └── src/components/AGENTS.md
│       └── src/components/Task/AGENTS.md
└── src-tauri/src/AGENTS.md
    └── src-tauri/src/db/AGENTS.md
```
