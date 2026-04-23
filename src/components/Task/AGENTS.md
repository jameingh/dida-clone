# Task Components

**Scope:** `src/components/Task/` - Task management UI

## OVERVIEW

Largest component folder (8 files) - all task-related rendering, interaction, and context menus.

## WHERE TO LOOK

| File | Purpose | Size |
|------|---------|------|
| `TaskList.tsx` | Virtualized/scrolled task list | Medium |
| `TaskItem.tsx` | Individual task row with checkbox | Small |
| `TaskDetail.tsx` | Right panel task editor | Large |
| `TaskForm.tsx` | Create/edit task form | Medium |
| `TaskContextMenu.tsx` | Right-click actions menu | Small |
| `ReminderManager.tsx` | Reminder UI logic | Medium |

## CONVENTIONS

### TaskItem Pattern
```tsx
<TaskItem
  task={task}
  onComplete={toggleTask}
  onClick={() => setActiveTask(task)}
  priority={task.priority} // High/Medium/Low/None color coding
/>
```

### Priority Colors
- `High`: Red accent
- `Medium`: Orange accent
- `Low`: Blue accent
- `None`: Gray

### Context Menu Usage
```tsx
<TaskContextMenu
  task={task}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
/>
```

## ANTI-PATTERNS

- **NO** direct data mutation - use hooks for all changes
- **NO** hardcoded priority colors - use `utils/priority.ts` helpers
- **AVOID** nesting TaskItem inside another TaskItem (use flat list with parent_id)

## NOTES

### Subtask Rendering
- Recursive component pattern for nested subtasks
- Indentation indicates depth level
- Max depth not enforced (consider adding)

### Date Display
- Use `utils/date.ts` for all date formatting
- Relative dates ("Today", "Tomorrow") preferred in list view
- Full dates in detail panel
