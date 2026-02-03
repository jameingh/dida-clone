import { useTask, useSubtasks, useCreateSubtaskSimple, useUpdateTaskOrders } from '../../hooks/useTasks';
import { useAppStore } from '../../store/useAppStore';
import { X, Calendar, Flag, AlignLeft, ListTodo, Plus, GripVertical } from 'lucide-react';
import { Priority } from '../../types';
import { useState, useEffect, useMemo } from 'react';
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
import { CSS } from '@dnd-kit/utilities';

export default function TaskDetail() {
  const { selectedTaskId, setSelectedTaskId } = useAppStore();
  const { data: task, isLoading } = useTask(selectedTaskId || '');
  const { data: subtasks } = useSubtasks(selectedTaskId || '');
  const createSubtask = useCreateSubtaskSimple();
  const updateTaskOrders = useUpdateTaskOrders();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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
      setNewSubtaskTitle('');
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
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
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
          <h3 className="text-[18px] font-bold text-gray-800 leading-snug">{task.title}</h3>
        </div>

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

          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 py-1 px-2 group">
            <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#1890FF] transition-colors" />
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="添加子任务..."
              className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder:text-gray-300"
            />
          </form>
        </div>

        {/* 设置属性 (日期, 优先级, 标签) */}
        <div className="pt-4 border-t border-gray-50 space-y-4">
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
        </div>
      </div>

      {/* 底部信息 */}
      <div className="p-4 bg-gray-50/50 text-[11px] text-gray-400 border-t border-gray-100 italic">
        创建于 {new Date(task.created_at * 1000).toLocaleString()}
      </div>
    </div>
  );
}
