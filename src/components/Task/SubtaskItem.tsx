import { useState, useRef, useEffect } from 'react';
import { Task } from '../../types';
import { useToggleTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getPriorityClass, getPriorityColor, getPriorityBgColor } from '../../utils/priority';

interface SubtaskItemProps {
    subtask: Task;
}

export default function SubtaskItem({ subtask }: SubtaskItemProps) {
    const toggleTask = useToggleTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(subtask.title);
    const originalTitleRef = useRef(subtask.title);
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

    // 同步外部标题变化
    useEffect(() => {
        if (!isEditing && subtask.title !== editTitle) {
            console.log('SubtaskItem sync subtask title:', subtask.id, subtask.title);
            setEditTitle(subtask.title);
            originalTitleRef.current = subtask.title;
        }
    }, [subtask.title, isEditing]);

    // 当任务完成时，确保退出编辑模式
    useEffect(() => {
        if (subtask.completed && isEditing) {
            setIsEditing(false);
        }
    }, [subtask.completed, isEditing]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        if (subtask.completed || isDragging) return;
        originalTitleRef.current = subtask.title;
        setIsEditing(true);
    };

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        // 如果正在编辑，先保存或关闭编辑
        if (isEditing) {
            await handleSave();
        }
        console.log('SubtaskItem toggling task:', subtask.id, subtask.title);
        toggleTask.mutate(subtask.id);
    };

    const handleTitleChange = (newTitle: string) => {
        setEditTitle(newTitle);
        // 实时更新缓存
        const updatedTask = { ...subtask, title: newTitle };
        queryClient.setQueryData(['task', subtask.id], updatedTask);
        
        // 更新主列表
        queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: Task[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(t => t.id === subtask.id ? updatedTask : t);
        });

        // 更新父任务的子任务列表
        if (subtask.parent_id) {
            queryClient.setQueryData(['subtasks', subtask.parent_id], (oldData: Task[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map(t => t.id === subtask.id ? updatedTask : t);
            });
        }
    };

    const handleSave = async () => {
        const trimmedTitle = editTitle.trim();
        if (trimmedTitle !== originalTitleRef.current) {
            console.log('SubtaskItem saving title:', subtask.id, trimmedTitle, 'original:', originalTitleRef.current);
            try {
                await updateTask.mutateAsync({ ...subtask, title: trimmedTitle || '无标题子任务' });
                originalTitleRef.current = trimmedTitle || '无标题子任务';
            } catch (err) {
                console.error('SubtaskItem save title failed:', err);
            }
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

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteTask.mutate(subtask.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-1 py-1 px-2 hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors cursor-pointer ${isDragging ? 'opacity-50 shadow-md bg-white ring-1 ring-[rgba(var(--dida-primary-rgb),0.1)]' : ''
                }`}
        >
            {/* 拖拽手柄 */}
            <div
                {...attributes}
                {...listeners}
                className="w-5 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-3.5 h-3.5 text-[var(--dida-text-tertiary)]" />
            </div>

            <div className="flex-shrink-0 flex items-center justify-center w-6">
                <div
                    onClick={handleToggle}
                    className={`dida-checkbox ${getPriorityClass(subtask.priority)} ${subtask.completed ? 'completed' : ''}`}
                    style={{
                        borderColor: !subtask.completed ? getPriorityColor(subtask.priority) : undefined,
                        backgroundColor: getPriorityBgColor(subtask.priority, !!subtask.completed),
                        width: '15px',
                        height: '15px',
                    }}
                />
            </div>

            <div className="flex-1 min-w-0 px-1" onClick={handleStartEdit}>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[var(--dida-primary)] rounded-sm px-1 text-[13px] outline-none"
                    />
                ) : (
                    <span
                        className={`text-[13px] transition-colors block truncate ${subtask.completed ? 'text-[var(--dida-text-tertiary)]' : 'text-[var(--dida-text-main)]'
                            }`}
                    >
                        {subtask.title || '无标题子任务'}
                    </span>
                )}
            </div>

            {/* 删除按钮 */}
            <button
                onClick={handleDelete}
                className="w-6 h-6 flex items-center justify-center text-[var(--dida-text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                title="删除子任务"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
