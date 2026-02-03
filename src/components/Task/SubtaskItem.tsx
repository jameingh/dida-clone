import { useState, useRef, useEffect } from 'react';
import { Task } from '../../types';
import { useToggleTask, useUpdateTask } from '../../hooks/useTasks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SubtaskItemProps {
    subtask: Task;
}

export default function SubtaskItem({ subtask }: SubtaskItemProps) {
    const toggleTask = useToggleTask();
    const updateTask = useUpdateTask();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(subtask.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sortable logic
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subtask.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
    };

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleTask.mutate(subtask.id);
    };

    const handleSave = () => {
        if (editTitle.trim() && editTitle !== subtask.title) {
            updateTask.mutate({ ...subtask, title: editTitle.trim() });
        } else {
            setEditTitle(subtask.title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditTitle(subtask.title);
            setIsEditing(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-1 py-1 px-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer ${isDragging ? 'opacity-50 shadow-md bg-white ring-1 ring-blue-100' : ''
                }`}
        >
            {/* 拖拽手柄 */}
            <div
                {...attributes}
                {...listeners}
                className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-3.5 h-3.5 text-gray-600" />
            </div>

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

            <div className="flex-1 min-w-0" onClick={() => !subtask.completed && !isDragging && setIsEditing(true)}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#1890FF] rounded-sm px-1 text-[13px] outline-none"
                    />
                ) : (
                    <span
                        className={`text-[13px] transition-colors block truncate ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                    >
                        {subtask.title}
                    </span>
                )}
            </div>
        </div>
    );
}
