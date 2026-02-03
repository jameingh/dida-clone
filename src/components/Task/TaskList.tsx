import { useTasks, useCreateTaskSimple } from '../../hooks/useTasks';
import { useAppStore } from '../../store/useAppStore';
import TaskItem from './TaskItem';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function TaskList() {
  const { selectedListId } = useAppStore();
  const { data: tasks, isLoading } = useTasks(selectedListId || undefined);
  const createTask = useCreateTaskSimple();
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

  const incompleteTasks = tasks?.filter((task) => !task.completed) || [];
  const completedTasks = tasks?.filter((task) => task.completed) || [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto pt-2">
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

        {tasks?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <div className="text-5xl mb-4">✨</div>
            <div className="text-[13px] font-medium">今天没有任务，享受生活吧</div>
          </div>
        )}
      </div>

      {/* 添加任务输入框 - 滴答清单风格 */}
      <div className="px-4 py-3 border-t border-gray-100">
        <form onSubmit={handleAddTask} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-md group hover:bg-gray-100 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1890FF]">
          <Plus className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="添加任务到..."
            className="flex-1 bg-transparent outline-none text-[14px] text-gray-700 placeholder:text-gray-400"
          />
        </form>
      </div>
    </div>
  );
}
