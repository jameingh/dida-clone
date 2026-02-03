import { useState, useRef, useEffect } from 'react';
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
import { useTasks, useCreateTaskSimple, useUpdateTaskOrders } from '../../hooks/useTasks';
import { useAppStore } from '../../store/useAppStore';
import TaskItem from './TaskItem';
import { Plus } from 'lucide-react';
import { Task } from '../../types';

export default function TaskList() {
  const { selectedListId, selectedTagId } = useAppStore();
  const { data: tasks, isLoading } = useTasks(selectedListId || undefined, selectedTagId || undefined);
  const createTask = useCreateTaskSimple();
  const updateTaskOrders = useUpdateTaskOrders();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 本地排序状态，用于流畅的拖拽响应
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);

  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

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

    const oldIndex = localTasks.findIndex((t) => t.id === active.id);
    const newIndex = localTasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(localTasks, oldIndex, newIndex);
    setLocalTasks(newTasks);

    // 准备批量更新数据
    const ascendingOrders: [string, number][] = newTasks.map((t, index) => [
      t.id,
      index * 10,
    ]);

    updateTaskOrders.mutate(ascendingOrders);
  };

  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener('focus-task-input', handleFocus);
    return () => window.removeEventListener('focus-task-input', handleFocus);
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && selectedListId) {
      createTask.mutate({
        title: newTaskTitle.trim(),
        listId: selectedListId,
      });
      setNewTaskTitle('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const incompleteTasks = localTasks.filter((task) => !task.completed);
  const completedTasks = localTasks.filter((task) => task.completed);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部快速添加栏 */}
      <div className="px-4 py-3 shrink-0">
        <form onSubmit={handleAddTask} className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Plus className="w-5 h-5 text-gray-400 group-focus-within:text-[#1890FF] transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="添加任务..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F5] focus:bg-white border text-[14px] border-transparent focus:border-gray-200 rounded text-gray-700 outline-none transition-all placeholder:text-gray-400"
          />
        </form>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={localTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {/* 未完成任务 */}
            <div>
              {incompleteTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>

            {/* 已完成任务 */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <div className="px-4 py-2 text-[12px] font-bold text-gray-400">
                  已完成 ({completedTasks.length})
                </div>
                <div>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
        </DndContext>

        {localTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <div className="text-5xl mb-4">✨</div>
            <div className="text-[13px] font-medium">今天没有任务，享受生活吧</div>
          </div>
        )}
      </div>
    </div>
  );
}
