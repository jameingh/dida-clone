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
import { Plus, Calendar, ChevronDown } from 'lucide-react';
import { useTasks, useCreateTaskExtended, useUpdateTaskOrders } from '../../hooks/useTasks';
import { Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import TaskItem from './TaskItem';
import DatePicker from '../Common/DatePicker';

export default function TaskList() {
  const { selectedListId, selectedTagId } = useAppStore();
  const { data: tasks, isLoading } = useTasks(selectedListId || undefined, selectedTagId || undefined);
  const createTask = useCreateTaskExtended();
  const updateTaskOrders = useUpdateTaskOrders();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<number | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // 本地排序状态，用于流畅的拖拽响应
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);

  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener('focus-task-input', handleFocus);
    return () => window.removeEventListener('focus-task-input', handleFocus);
  }, []);

  // 点击外部关闭日期选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  // 日期格式化函数
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}月${day}日, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && selectedListId) {
      createTask.mutate({
        title: newTaskTitle.trim(),
        listId: selectedListId,
        dueDate: newTaskDueDate,
        priority: undefined,
        tags: [],
        description: undefined,
      });
      setNewTaskTitle('');
      setNewTaskDueDate(undefined);
      setShowDatePicker(false);
    }
  };

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

  const incompleteTasks = localTasks.filter((task) => !task.completed);
  const completedTasks = localTasks.filter((task) => task.completed);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部快速添加栏 */}
      <div className="px-4 py-3 shrink-0">
        <form onSubmit={handleAddTask} className="relative">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F5F5F5] focus-within:bg-white border border-transparent focus-within:border-gray-200 rounded transition-all group">
            <Plus className="w-5 h-5 text-gray-400 group-focus-within:text-[#1890FF] transition-colors shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="添加任务..."
              className="flex-1 bg-transparent text-[14px] text-gray-700 outline-none placeholder:text-gray-400"
            />

            {/* 日期按钮 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-1 px-2 py-1 text-[13px] text-gray-500 hover:text-[#1890FF] hover:bg-blue-50 rounded transition-colors shrink-0"
              >
                {newTaskDueDate ? (
                  <>
                    <span className="text-[#1890FF]">{formatDate(newTaskDueDate)}</span>
                    <ChevronDown className="w-3 h-3 text-[#1890FF]" />
                  </>
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </button>

              {/* 日期选择器浮层 */}
              {showDatePicker && (
                <div ref={datePickerRef} className="absolute top-full right-0 mt-2 z-50">
                  <DatePicker
                    selectedDate={newTaskDueDate}
                    onSelect={(timestamp) => {
                      setNewTaskDueDate(timestamp);
                      setShowDatePicker(false);
                    }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
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
