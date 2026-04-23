# Frontend Knowledge Base

**Scope:** `src/` - React 19 + TypeScript frontend

## OVERVIEW

React 19 SPA with Vite bundler, Tailwind CSS 4 styling, React Query data management, Zustand UI state.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add feature component | `components/Feature/` | Create new folder per feature |
| Reusable UI | `components/Common/` | Button, Modal, Input primitives |
| Data fetching logic | `hooks/` (React Query) | `useTasks.ts` (7KB needs refactor) |
| API calls | `services/` | Tauri `invoke()` wrappers |
| UI state | `store/` | Zustand (UI only, not server data) |
| Type definitions | `types/` | Must mirror Rust models |
| Date/priority helpers | `utils/` | Domain-specific utilities |
| Feature constants | `constants/` | Segmented by domain |

## CONVENTIONS

### Imports
- No barrel exports - import directly from files
- `.ts` extension allowed via `allowImportingTsExtensions`
- Absolute paths not configured - use relative imports

### Component Structure
```tsx
// Feature components in dedicated folders
components/Task/
  ├── TaskList.tsx
  ├── TaskItem.tsx
  └── TaskDetail.tsx

// Reusable primitives
components/Common/
  ├── Button.tsx
  ├── Modal.tsx
  └── Input.tsx
```

### Data Flow
```
Component → Hook (React Query) → Service → Tauri IPC → Rust Backend
```

### State Separation
- **React Query**: Server state (tasks, lists, tags)
- **Zustand**: UI state (sidebar open/close, active panel)
- **NEVER** mix: Don't cache server data in Zustand

## ANTI-PATTERNS

- **NEVER** call `invoke()` directly in components - use `services/*.ts`
- **NEVER** use `as any` or `@ts-ignore` - fix type errors properly
- **DO NOT** use localStorage for app data - use Tauri commands only
- **AVOID** adding server state to Zustand - React Query handles caching
- **AVOID** logic in components - extract to hooks or utils

## NOTES

### Browser Debug Mode
Services detect non-Tauri environment → fall back to `localStorage` (key: `dida-tasks`). Use `npm run dev` for frontend-only debugging.

### Port
Dev server: `1420` (fixed in `vite.config.ts`)

### Tech Debt
- `useTasks.ts` (7KB) - too large, split by operation type
- No test files - add vitest + React Testing Library
