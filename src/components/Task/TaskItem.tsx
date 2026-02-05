import { useState } from 'react';
import { Task, Priority } from '../../types';
import { useToggleTask, useUpdateTask, useDeleteTask, useUndoDeleteTask, useDeleteTaskPermanently, useCreateSubtaskSimple } from '../../hooks/useTasks';
import { useTags } from '../../hooks/useTags';
import { useAppStore } from '../../store/useAppStore';
import { useAlertStore } from '../../store/useAlertStore';
import { GripVertical, MoreHorizontal, Trash2, RotateCcw, XCircle, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import ContextMenu, { ContextMenuItem, ContextMenuSeparator } from '../Common/ContextMenu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  depth?: number;
}

export default function TaskItem({ task, depth = 0 }: TaskItemProps) {
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const undoDeleteTask = useUndoDeleteTask();
  const deleteTaskPermanently = useDeleteTaskPermanently();
  const updateTask = useUpdateTask();
  const createSubtask = useCreateSubtaskSimple();
  const { data: allTags } = useTags();
  const { selectedTaskId, setSelectedTaskId, showToast, selectedListId } = useAppStore();
  const { showAlert } = useAlertStore();
  const isSelected = selectedTaskId === task.id;
  const isTrashView = selectedListId === 'smart_trash';

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask.mutate(task.id);
  };

  console.log('Rendering TaskItem:', task.id, task.title);

  const handleClick = () => {
    // 如果正在拖拽，不触发点击
    if (isDragging) return;
    setSelectedTaskId(task.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        showToast('任务已删除', '撤销', () => {
          undoDeleteTask.mutate(task.id);
        });
      }
    });
    setMenuPos(null);
  };

  const handleRestore = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    undoDeleteTask.mutate(task.id);
    setMenuPos(null);
  };

  const handleDeletePermanently = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuPos(null);
    showAlert({
      title: '永久删除任务',
      message: '确定要永久删除这个任务吗？此操作不可撤销。',
      type: 'error',
      confirmLabel: '删除',
      onConfirm: () => {
        deleteTaskPermanently.mutate(task.id);
      }
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleSetPriority = (priority: Priority) => {
    updateTask.mutate({ ...task, priority });
    setMenuPos(null);
  };

  const handleSetDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    updateTask.mutate({ ...task, due_date: Math.floor(date.getTime() / 1000) });
    setMenuPos(null);
  };

  const handleAddSubtask = () => {
    createSubtask.mutate({
      title: '',
      parentId: task.id,
      listId: task.list_id,
    }, {
      onSuccess: (newSubtask) => {
        setSelectedTaskId(newSubtask.id);
      }
    });
    setMenuPos(null);
  };

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'priority-high';
      case Priority.Medium: return 'priority-medium';
      case Priority.Low: return 'priority-low';
      default: return 'priority-none';
    }
  };

  // 直接使用全局 CSS 变量，保证和优先级颜色 100% 一致
  const getPriorityColorVar = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'var(--priority-high)';
      case Priority.Medium: return 'var(--priority-medium)';
      case Priority.Low: return 'var(--priority-low)';
      default: return 'var(--priority-none)';
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          paddingLeft: `${depth * 20}px`
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`group flex items-center gap-1 px-1 py-1.5 border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#F0F7FF]' : 'hover:bg-[#FAFAFA]'
          } ${isDragging ? 'opacity-50 shadow-lg bg-white ring-1 ring-blue-100 rounded-sm' : ''}`}
      >
        {/* 拖拽手柄 - 悬浮可见 */}
        <div
          {...attributes}
          {...listeners}
          className="w-6 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>

        {/* 滴答清单风格 Checkbox */}
        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <div
            onClick={handleToggle}
            className={`dida-checkbox ${getPriorityClass(task.priority)} ${task.completed ? 'completed' : ''}`}
            style={{
              // 边框颜色和优先级颜色保持一致
              borderColor: getPriorityColorVar(task.priority),
              // 未完成时用浅色背景，完成后用实色背景
              backgroundColor: task.completed
                ? getPriorityColorVar(task.priority)
                : 'color-mix(in srgb, ' + getPriorityColorVar(task.priority) + ' 18%, #ffffff 82%)',
            }}
          />
        </div>

        {/* 任务内容 */}
        <div className="flex-1 min-w-0 px-1">
          <div
            className={`text-[14px] leading-tight truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'
              }`}
          >
            {task.title || '无标题任务'}
          </div>
        </div>

        {/* 标签 - 移动到右侧，日期的左边 */}
        {task.tags.length > 0 && (
          <div className="flex-shrink-0 flex gap-1 px-1">
            {task.tags.slice(0, 3).map((tagId) => {
              const tag = allTags?.find(t => t.id === tagId);
              return (
                <span
                  key={tagId}
                  className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-medium"
                  style={tag ? { color: tag.color, backgroundColor: `${tag.color}15` } : undefined}
                >
                  #{tag?.name || '未知'}
                </span>
              );
            })}
          </div>
        )}

        {/* 任务日期 - 已经在右侧 */}
        {task.due_date && (
          <div className="flex-shrink-0 flex items-center text-[11px] text-gray-400 font-medium px-2">
            <span>{format(new Date(task.due_date * 1000), 'M月d日')}</span>
          </div>
        )}

        {/* 快速操作 - 仅悬浮可见 */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
          {isTrashView ? (
            <>
              <button
                title="恢复"
                onClick={handleRestore}
                className="p-1 px-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-500 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                title="永久删除"
                onClick={handleDeletePermanently}
                className="p-1 px-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                title="更多"
                onClick={handleContextMenu}
                className="p-1 px-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)}>
          {isTrashView ? (
            <>
              <ContextMenuItem
                label="恢复任务"
                onClick={handleRestore}
                icon={<RotateCcw className="w-4 h-4" />}
              />
              <ContextMenuItem
                label="永久删除"
                danger
                onClick={handleDeletePermanently}
                icon={<XCircle className="w-4 h-4" />}
              />
            </>
          ) : (
            <>
              <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">截止日期</div>
              <ContextMenuItem label="今天" onClick={() => handleSetDate(0)} />
              <ContextMenuItem label="明天" onClick={() => handleSetDate(1)} />
              <ContextMenuItem label="下周" onClick={() => handleSetDate(7)} />

              <ContextMenuSeparator />

              <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">优先级</div>
              <ContextMenuItem
                label="高优先级"
                active={task.priority === Priority.High}
                onClick={() => handleSetPriority(Priority.High)}
                icon={<div className="w-2 h-2 rounded-full bg-red-500" />}
              />
              <ContextMenuItem
                label="中优先级"
                active={task.priority === Priority.Medium}
                onClick={() => handleSetPriority(Priority.Medium)}
                icon={<div className="w-2 h-2 rounded-full bg-orange-500" />}
              />
              <ContextMenuItem
                label="低优先级"
                active={task.priority === Priority.Low}
                onClick={() => handleSetPriority(Priority.Low)}
                icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
              />
              <ContextMenuItem
                label="无优先级"
                active={task.priority === Priority.None}
                onClick={() => handleSetPriority(Priority.None)}
                icon={<div className="w-2 h-2 rounded-full bg-gray-300" />}
              />

              <ContextMenuSeparator />

              <ContextMenuItem
                label="添加子任务"
                onClick={handleAddSubtask}
                icon={<ListTodo className="w-4 h-4" />}
              />

              <ContextMenuSeparator />

              <ContextMenuItem
                label="删除任务"
                danger
                onClick={() => handleDelete()}
                icon={<Trash2 className="w-4 h-4" />}
              />
            </>
          )}
        </ContextMenu>
      )}
    </>
  );
}
