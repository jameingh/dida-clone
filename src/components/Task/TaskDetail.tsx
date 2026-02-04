import { useTask, useSubtasks, useCreateSubtaskSimple, useUpdateTaskOrders, useUpdateTask, useUndoDeleteTask, useDeleteTaskPermanently } from '../../hooks/useTasks';
import { useTags } from '../../hooks/useTags';
import { useAppStore } from '../../store/useAppStore';
import { useAlertStore } from '../../store/useAlertStore';
import { X, Calendar, Flag, AlignLeft, ListTodo, Plus, Hash, RotateCcw, Trash2 } from 'lucide-react';
import { Priority } from '../../types';
import { useState, useEffect, useRef } from 'react';
import SubtaskItem from './SubtaskItem';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export default function TaskDetail() {
  const { selectedTaskId, setSelectedTaskId, selectedListId } = useAppStore();
  const { showAlert } = useAlertStore();
  const { data: task, isLoading } = useTask(selectedTaskId || '');
  const { data: subtasks } = useSubtasks(selectedTaskId || '');
  const { data: allTags } = useTags();
  const createSubtask = useCreateSubtaskSimple();
  const updateTaskOrders = useUpdateTaskOrders();
  const updateTask = useUpdateTask();
  const undoDeleteTask = useUndoDeleteTask();
  const deleteTaskPermanently = useDeleteTaskPermanently();
  const [newSubtaskTitle, setNewTaskTitle] = useState('');

  const isTrashView = selectedListId === 'smart_trash';

  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const tagPopoverRef = useRef<HTMLDivElement>(null);
  const tagTriggerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭标签 Popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isTagPopoverOpen &&
        tagPopoverRef.current &&
        !tagPopoverRef.current.contains(event.target as Node) &&
        tagTriggerRef.current &&
        !tagTriggerRef.current.contains(event.target as Node)
      ) {
        setIsTagPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagPopoverOpen]);

  // 本地子任务状态，用于流畅的拖放响应
  const [localSubtasks, setLocalSubtasks] = useState(subtasks || []);

  useEffect(() => {
    if (subtasks) {
      setLocalSubtasks(subtasks);
    }
  }, [subtasks, selectedTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSubtasks.findIndex((t) => t.id === active.id);
    const newIndex = localSubtasks.findIndex((t) => t.id === over.id);

    const newSubtasks = arrayMove(localSubtasks, oldIndex, newIndex);
    setLocalSubtasks(newSubtasks);

    const ascendingOrders: [string, number][] = newSubtasks.map((t, index) => [
      t.id,
      index * 10,
    ]);

    updateTaskOrders.mutate(ascendingOrders);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim() && task) {
      createSubtask.mutate({
        title: newSubtaskTitle.trim(),
        parentId: task.id,
        listId: task.list_id,
      });
      setNewTaskTitle('');
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (!task) return;
    const currentTags = task.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];

    updateTask.mutate({
      ...task,
      tags: newTags
    });
  };

  const handleRestore = () => {
    if (task) {
      undoDeleteTask.mutate(task.id);
      setSelectedTaskId(null);
    }
  };

  const handleDeletePermanently = () => {
    if (task) {
      showAlert({
        title: '永久删除任务',
        message: '确定要永久删除这个任务吗？此操作不可撤销。',
        type: 'error',
        confirmLabel: '删除',
        onConfirm: () => {
          deleteTaskPermanently.mutate(task.id);
          setSelectedTaskId(null);
        }
      });
    }
  };

  if (!selectedTaskId) {
    return (
      <div className="w-96 border-l border-gray-200 bg-white flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-sm">选择一个任务查看详情</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-96 border-l border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col relative">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${task.priority === Priority.High ? 'bg-red-500' :
            task.priority === Priority.Medium ? 'bg-orange-500' :
              task.priority === Priority.Low ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
          <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">任务详情</h2>
        </div>
        <button
          onClick={() => setSelectedTaskId(null)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
        {/* 标题 */}
        <div>
          <h3 className={`text-[18px] font-bold text-gray-800 leading-snug ${isTrashView ? 'text-gray-400' : ''}`}>{task.title}</h3>
        </div>

        {/* 垃圾桶视图下的操作按钮 */}
        {isTrashView && (
          <div className="flex gap-2">
            <button
              onClick={handleRestore}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1890FF] text-white rounded-md hover:bg-[#40a9ff] transition-colors text-[13px] font-medium shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              恢复任务
            </button>
            <button
              onClick={handleDeletePermanently}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors text-[13px] font-medium"
            >
              <Trash2 className="w-4 h-4" />
              永久删除
            </button>
          </div>
        )}

        {/* 描述区域 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-tighter">
            <AlignLeft className="w-3.5 h-3.5" />
            <span>描述</span>
          </div>
          <div className="min-h-[60px] p-2 -mx-2 hover:bg-gray-50 rounded-md transition-colors cursor-text group">
            {task.description ? (
              <p className="text-[13px] text-gray-700 leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-[13px] text-gray-300 italic">点此添加详细描述...</p>
            )}
          </div>
        </div>

        {/* 子任务区域 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-tighter">
            <ListTodo className="w-3.5 h-3.5" />
            <span>子任务 {localSubtasks.length ? `(${localSubtasks.length})` : ''}</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={localSubtasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {localSubtasks.map((subtask) => (
                  <SubtaskItem key={subtask.id} subtask={subtask} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {!isTrashView && (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 py-1 px-2 group">
              <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#1890FF] transition-colors" />
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="添加子任务..."
                className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder:text-gray-300"
              />
            </form>
          )}
        </div>

        {/* 设置属性 (日期, 优先级, 标签) */}
        <div className={`pt-4 border-t border-gray-50 space-y-4 pb-8 ${isTrashView ? 'pointer-events-none opacity-60' : ''}`}>
          <div className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>日期</span>
            </div>
            <div className="font-medium text-gray-700">
              {task.due_date ? new Date(task.due_date * 1000).toLocaleDateString() : '未设置'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 text-gray-400">
              <Flag className="w-4 h-4" />
              <span>优先级</span>
            </div>
            <div className="flex gap-1">
              {[Priority.None, Priority.Low, Priority.Medium, Priority.High].map((p) => (
                <div
                  key={p}
                  className={`w-4 h-4 rounded-sm border ${task.priority === p
                    ? 'border-[#1890FF] bg-[#E6F7FF]'
                    : 'border-gray-200'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between text-[13px]">
            <div
              ref={tagTriggerRef}
              onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
              className="flex items-center gap-2 text-gray-400 mt-1 cursor-pointer hover:text-gray-600 transition-colors"
            >
              <Hash className="w-4 h-4" />
              <span>标签</span>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 flex-1 pl-4">
              {Array.isArray(task.tags) && task.tags.map(tagId => {
                const tagInfo = (allTags || []).find(t => t.id === tagId);
                return (
                  <span
                    key={tagId}
                    onClick={() => handleToggleTag(tagId)}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    {tagInfo?.name || tagId}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 标签简易选择器 Popover */}
      {isTagPopoverOpen && (
        <div
          ref={tagPopoverRef}
          className="absolute bottom-24 right-6 w-48 bg-white border border-gray-100 shadow-xl rounded-lg p-2 z-50"
        >
          <div className="text-[11px] font-bold text-gray-400 px-2 py-1 uppercase tracking-tighter border-b border-gray-50 mb-1">选择标签</div>
          <div className="max-h-48 overflow-y-auto">
            {(allTags || []).map(tag => (
              <div
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-[#F0F7FF] rounded-md cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#CBD5E0' }} />
                  <span className="text-[13px] text-gray-700">{tag.name}</span>
                </div>
                {Array.isArray(task.tags) && task.tags.includes(tag.id) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1890FF]" />
                )}
              </div>
            ))}
            {(!allTags || allTags.length === 0) && (
              <div className="px-2 py-4 text-center text-xs text-gray-400 italic">暂无可用标签</div>
            )}
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="p-4 bg-gray-50/50 text-[11px] text-gray-400 border-t border-gray-100 italic">
        创建于 {task.created_at ? new Date(task.created_at * 1000).toLocaleString() : '未知'}
      </div>
    </div>
  );
}
