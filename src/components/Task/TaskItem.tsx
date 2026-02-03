import { Task, Priority } from '../../types';
import { useToggleTask } from '../../hooks/useTasks';
import { useAppStore } from '../../store/useAppStore';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const toggleTask = useToggleTask();
  const { selectedTaskId, setSelectedTaskId } = useAppStore();
  const isSelected = selectedTaskId === task.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTask.mutate(task.id);
  };

  const handleClick = () => {
    setSelectedTaskId(task.id);
  };

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'priority-high';
      case Priority.Medium: return 'priority-medium';
      case Priority.Low: return 'priority-low';
      default: return 'priority-none';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-4 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#F0F7FF]' : 'hover:bg-[#FAFAFA]'
        }`}
    >
      {/* 滴答清单风格 Checkbox */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          onClick={handleToggle}
          className={`dida-checkbox ${getPriorityClass(task.priority)} ${task.completed ? 'completed' : ''}`}
        />
      </div>

      {/* 任务内容 */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[14px] leading-tight mb-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'
            }`}
        >
          {task.title}
        </div>

        {/* 任务元信息 */}
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(task.due_date * 1000), 'M月d日')}
              </span>
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex gap-1">
              {task.tags.slice(0, 2).map((tagId) => (
                <span
                  key={tagId}
                  className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-400 rounded-sm font-medium"
                >
                  #{tagId}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
