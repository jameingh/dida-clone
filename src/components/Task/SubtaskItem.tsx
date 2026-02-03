import { Task } from '../../types';
import { useToggleTask } from '../../hooks/useTasks';

interface SubtaskItemProps {
    subtask: Task;
}

export default function SubtaskItem({ subtask }: SubtaskItemProps) {
    const toggleTask = useToggleTask();

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleTask.mutate(subtask.id);
    };

    return (
        <div className="group flex items-center gap-3 py-1.5 px-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
            <div
                onClick={handleToggle}
                className={`w-4 h-4 rounded-[3px] border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${subtask.completed
                        ? 'bg-gray-400 border-gray-400'
                        : 'border-gray-300 hover:border-[#1890FF]'
                    }`}
            >
                {subtask.completed && (
                    <div className="w-[8px] h-[5px] border-b-[2px] border-l-[2px] border-white -rotate-45 mt-[-1px]" />
                )}
            </div>
            <span
                className={`text-[13px] transition-colors ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
            >
                {subtask.title}
            </span>
        </div>
    );
}
