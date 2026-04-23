# UI Components

**Scope:** `src/components/` - React component library

## OVERVIEW

Feature-based component organization for task management UI.

## STRUCTURE

```
components/
├── Task/           # Task-related (8 files - largest)
│   ├── TaskList.tsx
│   ├── TaskItem.tsx
│   ├── TaskDetail.tsx
│   ├── TaskForm.tsx
│   ├── TaskContextMenu.tsx
│   └── ...
├── Layout/         # Structural components
│   ├── MainLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── Common/         # Reusable primitives
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Input.tsx
│   └── ...
└── Tag/            # Tag management (2 files)
    ├── TagManager.tsx
    └── TagContextMenu.tsx
```

**Note:** No `List/` folder - List UI is embedded in `Sidebar.tsx`

## WHERE TO LOOK

| Add This | Go Here | Create New |
|----------|---------|------------|
| Task feature | `Task/` | Yes |
| Layout change | `Layout/` | No |
| Reusable UI | `Common/` | Maybe (check existing first) |
| Tag feature | `Tag/` | Yes |

## CONVENTIONS

### Component Naming
- PascalCase filenames matching component name
- One component per file (no multi-export files)
- Feature folders group related components

### Props Interface
```tsx
interface TaskItemProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onComplete, onDelete }: TaskItemProps) {
  // ...
}
```

### Context Menus
Extracted as separate components per entity:
- `TaskContextMenu.tsx`
- `TagContextMenu.tsx`
- Reusable pattern - follow this for new entities

## ANTI-PATTERNS

- **NO** inline `invoke()` calls - use hooks from `src/hooks/`
- **NO** business logic in components - extract to hooks/utils
- **AVOID** deeply nested component trees - compose at usage site
- **NO** CSS modules or styled-components - Tailwind only

## STYLING

- Tailwind utility classes for all styling
- Global styles: `src/index.css`
- Custom colors: `constants/colors.ts` → `tailwind.config.js` primary palette

## NOTES

### Missing Components
- No `List/` folder - list rendering is in `Sidebar.tsx`
- Consider extracting if list logic grows

### Component Size
- Keep components <200 lines
- Extract complex logic to hooks
- Extract repetitive UI to `Common/`
