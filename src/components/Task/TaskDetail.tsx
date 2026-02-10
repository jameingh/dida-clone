import { useTask, useSubtasks, useCreateSubtaskSimple, useUpdateTaskOrders, useUpdateTask, useUndoDeleteTask, useDeleteTaskPermanently, useDeleteTask, useToggleTask } from '../../hooks/useTasks';
import { useTags, useCreateTag } from '../../hooks/useTags';
import { useAppStore } from '../../store/useAppStore';
import { useAlertStore } from '../../store/useAlertStore';
import { X, Calendar, Flag, AlignLeft, ListTodo, Plus, Hash, RotateCcw, Trash2, MoreHorizontal, CheckSquare, Square, ChevronRight, Type, MessageSquare, Copy, Printer, Archive, ArrowUpToLine, History, FileText, Play, Save, Link, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, Paperclip, Workflow, Link2, Search } from 'lucide-react';
import { Priority, Task } from '../../types';
import { useState, useEffect, useRef, useMemo } from 'react';
import SubtaskItem from './SubtaskItem';
import DatePicker from '../Common/DatePicker';
import { useLists } from '../../hooks/useLists';
import { useQueryClient } from '@tanstack/react-query';

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
  
  // 拉伸宽度管理
  const [width, setWidth] = useState(400); // 默认宽度
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 350; // 最小宽度安全区
  const maxWidth = 800; // 最大宽度安全区

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      // 移除全局样式防止 Tauri 选中
      const styleId = 'disable-select-style';
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      // Tauri 环境下，有时候单纯的 userSelect = 'none' 不够，需要注入全局 CSS
      const styleId = 'disable-select-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          * {
            -webkit-user-select: none !important;
            user-select: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const { showAlert } = useAlertStore();
  const queryClient = useQueryClient();
  const { data: task, isLoading } = useTask(selectedTaskId || '');
  const { data: subtasks } = useSubtasks(selectedTaskId || '');
  const { data: allTags } = useTags();
  const createTag = useCreateTag();
  const { data: allLists } = useLists();
  const createSubtask = useCreateSubtaskSimple();
  const updateTaskOrders = useUpdateTaskOrders();
  const updateTask = useUpdateTask();
  const undoDeleteTask = useUndoDeleteTask();
  const deleteTaskPermanently = useDeleteTaskPermanently();
  const deleteTask = useDeleteTask();
  const [newSubtaskTitle, setNewTaskTitle] = useState('');

  const isTrashView = selectedListId === 'smart_trash';

  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState('');
  const tagSearchInputRef = useRef<HTMLInputElement>(null);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const tagPopoverRef = useRef<HTMLDivElement>(null);
  const tagTriggerRef = useRef<HTMLButtonElement>(null);
  const priorityPopoverRef = useRef<HTMLDivElement>(null);
  const priorityTriggerRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const originalTitleRef = useRef('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const toggleTask = useToggleTask();

  const slashMenuItems = useMemo(() => [
    { icon: Heading1, label: '一级标题', section: 'text' },
    { icon: Heading2, label: '二级标题', section: 'text' },
    { icon: Heading3, label: '三级标题', section: 'text' },
    { icon: List, label: '无序列表', section: 'list' },
    { icon: ListOrdered, label: '有序列表', section: 'list' },
    { icon: CheckSquare, label: '检查项', section: 'list' },
    { icon: Quote, label: '引用', section: 'other' },
    { icon: Minus, label: '水平分割线', section: 'other' },
    { icon: Paperclip, label: '附件', section: 'action' },
    { icon: Workflow, label: '子任务', section: 'action' },
    { icon: Hash, label: '标签', section: 'action' },
    { icon: Link2, label: '关联任务/笔记', section: 'action' },
  ], []);

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'priority-high';
      case Priority.Medium: return 'priority-medium';
      case Priority.Low: return 'priority-low';
      default: return 'priority-none';
    }
  };

  const getPriorityColorVar = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return 'var(--priority-high)';
      case Priority.Medium: return 'var(--priority-medium)';
      case Priority.Low: return 'var(--priority-low)';
      default: return 'var(--priority-none)';
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task) {
      toggleTask.mutate(task.id);
    }
  };

  useEffect(() => {
    if (task && !isEditingTitle) {
      console.log('TaskDetail sync task title:', task.id, task.title);
      setEditTitleValue(task.title);
      // 如果标题为空（如新创建的任务），自动进入编辑模式并聚焦
      if (task.title === '' && !isTrashView) {
        setIsEditingTitle(true);
        originalTitleRef.current = '';
      }
    }
  }, [task?.id, task?.title, isTrashView, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      // 使用 requestAnimationFrame 确保在 DOM 渲染后执行聚焦
      const timer = requestAnimationFrame(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isEditingTitle]);

  const handleTitleStartEdit = () => {
    if (isTrashView) return;
    originalTitleRef.current = task?.title || '';
    setIsEditingTitle(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditTitleValue(newTitle);
    if (task) {
      // 实时更新本地缓存，实现列表和详情的同步
      const updatedTask = { ...task, title: newTitle };
      queryClient.setQueryData(['task', task.id], updatedTask);
      
      // 更新主列表缓存
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(t => t.id === task.id ? updatedTask : t);
      });

      // 如果是子任务，更新父任务的子任务列表缓存
      if (task.parent_id) {
        queryClient.setQueryData(['subtasks', task.parent_id], (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(t => t.id === task.id ? updatedTask : t);
        });
      }
    }
  };

  const handleTitleSave = () => {
    const trimmedTitle = editTitleValue.trim();
    if (task && trimmedTitle !== originalTitleRef.current) {
      console.log('TaskDetail saving title:', task.id, trimmedTitle, 'original:', originalTitleRef.current);
      updateTask.mutate({
        ...task,
        title: trimmedTitle || '无标题任务' // 防止保存空标题
      });
      // 保存后更新 originalTitleRef，防止重复保存或逻辑错误
      originalTitleRef.current = trimmedTitle || '无标题任务';
    }
    setIsEditingTitle(false);
  };

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuTriggerRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭 Popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 标签 Popover
      if (
        isTagPopoverOpen &&
        tagPopoverRef.current &&
        !tagPopoverRef.current.contains(target) &&
        tagTriggerRef.current &&
        !tagTriggerRef.current.contains(target)
      ) {
        setIsTagPopoverOpen(false);
      }
      
      // 优先级 Popover
      if (
        isPriorityPopoverOpen &&
        priorityPopoverRef.current &&
        !priorityPopoverRef.current.contains(target) &&
        priorityTriggerRef.current &&
        !priorityTriggerRef.current.contains(target)
      ) {
        setIsPriorityPopoverOpen(false);
      }

      // 日期选择器 Popover
      if (
        isDatePickerOpen &&
        datePickerRef.current &&
        !datePickerRef.current.contains(target) &&
        dateTriggerRef.current &&
        !dateTriggerRef.current.contains(target)
      ) {
        setIsDatePickerOpen(false);
      }

      // 更多菜单 Popover
    if (
      isMoreMenuOpen &&
      moreMenuRef.current &&
      !moreMenuRef.current.contains(target) &&
      moreMenuTriggerRef.current &&
      !moreMenuTriggerRef.current.contains(target)
    ) {
      setIsMoreMenuOpen(false);
    }

    // Slash 菜单 Popover
    if (
      isSlashMenuOpen &&
      slashMenuRef.current &&
      !slashMenuRef.current.contains(target)
    ) {
      setIsSlashMenuOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isTagPopoverOpen, isPriorityPopoverOpen, isDatePickerOpen, isMoreMenuOpen, isSlashMenuOpen]);

useEffect(() => {
  if (task && !isEditingDescription) {
    setDescriptionValue(task.description || '');
  }
}, [task?.description, isEditingDescription]);

useEffect(() => {
  if (isEditingDescription) {
    descriptionInputRef.current?.focus();
  }
}, [isEditingDescription]);

const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newValue = e.target.value;
  setDescriptionValue(newValue);
  
  // 检查是否输入了 /
  if (newValue.endsWith('/')) {
    setIsSlashMenuOpen(true);
  } else if (isSlashMenuOpen) {
    setIsSlashMenuOpen(false);
  }
};

const handleDescriptionBlur = () => {
    // 延迟关闭编辑模式，以便点击 Slash 菜单
    setTimeout(() => {
      // 如果 Slash 菜单还开着，不执行保存，因为菜单点击会处理
      if (isSlashMenuOpen) return;

      if (task && descriptionValue !== (task.description || '')) {
        updateTask.mutate({
          ...task,
          description: descriptionValue
        });
      }
      setIsEditingDescription(false);
    }, 200);
  };

  const handleSlashItemClick = (label: string) => {
    // 1. 立即停止冒泡，防止触发其他事件
    // 注意：这里没有 event 对象，因为是 button 的 onClick
    
    // 2. 计算并更新描述（移除最后的 /）
    let newDesc = descriptionValue;
    if (descriptionValue.endsWith('/')) {
      newDesc = descriptionValue.slice(0, -1);
      setDescriptionValue(newDesc);
      
      // 3. 立即触发一次保存到数据库，确保状态同步
      if (task) {
        updateTask.mutate({
          ...task,
          description: newDesc
        });
      }
    }

    // 4. 处理具体功能
    if (label === '标签') {
      setIsTagPopoverOpen(true);
    }
    
    // 5. 关闭菜单并强制回焦
    setIsSlashMenuOpen(false);
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  };

// 本地子任务状态，用于流畅的拖放响应
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>([]);

  useEffect(() => {
    if (subtasks) {
      // 过滤掉已删除的子任务
      const filteredSubtasks = subtasks.filter(t => !t.is_deleted);
      setLocalSubtasks(filteredSubtasks);
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

  const filteredTags = useMemo(() => {
    if (!allTags) return [];
    const search = tagSearchValue.toLowerCase().trim();
    return allTags.filter(tag => 
      !task?.tags?.includes(tag.id) && 
      tag.name.toLowerCase().includes(search)
    );
  }, [allTags, task?.tags, tagSearchValue]);

  const showCreateOption = useMemo(() => {
    const search = tagSearchValue.trim();
    if (!search) return false;
    return !allTags?.some(tag => tag.name.toLowerCase() === search.toLowerCase());
  }, [allTags, tagSearchValue]);

  const handleCreateAndAddTag = async () => {
    const name = tagSearchValue.trim();
    if (!name || !task) return;

    try {
      // 随机生成一个颜色，或者默认一个颜色
      const colors = ['#FF4D4F', '#FF7A45', '#FFA940', '#FFC53D', '#FFEC3D', '#BAE637', '#73D13D', '#5CDBD3', '#40A9FF', '#597EF7', '#9254DE', '#F759AB'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newTag = await createTag.mutateAsync({ name, color: randomColor });
      if (newTag) {
        handleToggleTag(newTag.id);
        setTagSearchValue('');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  useEffect(() => {
    if (isTagPopoverOpen) {
      setTagSearchValue('');
      // 延迟聚焦，确保 DOM 已渲染
      setTimeout(() => tagSearchInputRef.current?.focus(), 50);
    }
  }, [isTagPopoverOpen]);

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
    // 选择标签后自动关闭弹窗
    setIsTagPopoverOpen(false);
  };

  const handlePriorityChange = (priority: Priority) => {
    if (!task) return;
    updateTask.mutate({ ...task, priority });
    setIsPriorityPopoverOpen(false);
  };

  const handleDateChange = (timestamp: number | undefined, reminder?: string) => {
        if (!task) return;
        updateTask.mutate({
            ...task,
            due_date: timestamp || null,
            reminder: reminder || null
        });
        setIsDatePickerOpen(false);
    };

  const handleDelete = () => {
    if (task) {
      deleteTask.mutate(task.id);
      setSelectedTaskId(null);
    }
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

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '设置日期';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    
    // 格式化日期部分
    let dateStr = '';
    if (date.getFullYear() === now.getFullYear()) {
      dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    } else {
      dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    // 检查是否有时间部分（如果小时和分钟都是0，且后端约定00:00表示没设置时间，则不显示）
    // 但在滴答清单中，如果用户设置了时间，就会显示。
    // 我们这里简单判断：如果不是 00:00，就显示时间
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours !== 0 || minutes !== 0) {
      dateStr += ` ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return dateStr;
  };

  if (!selectedTaskId) {
    return (
      <div 
        style={{ width: `${width}px` }}
        className="border-l border-gray-200 bg-white flex items-center justify-center relative flex-shrink-0"
      >
        {/* 左侧拉伸条 */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-50"
        />
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-sm">选择一个任务查看详情</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        style={{ width: `${width}px` }}
        className="border-l border-gray-200 bg-white flex items-center justify-center relative flex-shrink-0"
      >
        {/* 左侧拉伸条 */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-50"
        />
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div 
      style={{ width: `${width}px` }}
      className="border-l border-gray-200 bg-white flex flex-col relative flex-shrink-0"
    >
      {/* 左侧拉伸条 */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-50"
      />
      {/* 头部 */}
      <div className="flex items-center justify-between p-2 border-b border-gray-100 h-12">
        <div className="flex items-center gap-2">
          {/* 滴答清单风格 Checkbox */}
          <div className="flex-shrink-0 flex items-center justify-center pl-1">
            <div
              onClick={handleToggle}
              className={`dida-checkbox ${getPriorityClass(task.priority)} ${task.completed ? 'completed' : ''}`}
              style={{
                borderColor: getPriorityColorVar(task.priority),
                backgroundColor: task.completed
                  ? getPriorityColorVar(task.priority)
                  : 'color-mix(in srgb, ' + getPriorityColorVar(task.priority) + ' 18%, #ffffff 82%)',
                width: '18px',
                height: '18px',
              }}
            />
          </div>

          {/* 日期选择器 */}
          <div className="relative">
            <button
              ref={dateTriggerRef}
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
            >
              {(() => {
                const isOverdue = task.due_date && (new Date(task.due_date * 1000).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));
                const iconColor = isOverdue ? 'text-[#FF4D4F]' : (task.due_date ? 'text-[#1890FF]' : 'text-gray-400');
                const textColor = isOverdue ? 'text-[#FF4D4F]' : (task.due_date ? 'text-gray-700' : 'text-gray-400');
                
                return (
                  <>
                    <Calendar className={`w-4 h-4 ${iconColor}`} />
                    <span className={`text-[13px] font-medium ${textColor}`}>
                      {formatDate(task.due_date)}
                    </span>
                  </>
                );
              })()}
            </button>
            {isDatePickerOpen && (
              <div ref={datePickerRef} className="absolute top-full left-0 mt-1 z-50">
                <DatePicker
                  selectedDate={task.due_date || undefined}
                  onSelect={handleDateChange}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 优先级 */}
          <div className="relative">
            <button
              ref={priorityTriggerRef}
              type="button"
              onClick={() => setIsPriorityPopoverOpen(!isPriorityPopoverOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="设置优先级"
            >
              <Flag className={`w-4 h-4 ${task.priority === Priority.High ? 'text-red-500 fill-red-500' :
                task.priority === Priority.Medium ? 'text-orange-500 fill-orange-500' :
                  task.priority === Priority.Low ? 'text-blue-500 fill-blue-500' : 'text-gray-400'
                }`} />
            </button>
            {isPriorityPopoverOpen && (
              <div
                ref={priorityPopoverRef}
                className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50"
              >
                {[
                  { value: Priority.High, label: '高优先级', color: 'text-red-500' },
                  { value: Priority.Medium, label: '中优先级', color: 'text-orange-500' },
                  { value: Priority.Low, label: '低优先级', color: 'text-blue-500' },
                  { value: Priority.None, label: '无优先级', color: 'text-gray-400' },
                ].map((p) => (
                  <div
                    key={p.value}
                    onClick={() => handlePriorityChange(p.value)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  >
                    <Flag className={`w-3.5 h-3.5 ${p.color} ${task.priority === p.value ? 'fill-current' : ''}`} />
                    <span className="text-[12px] text-gray-700">{p.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              ref={moreMenuTriggerRef}
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${isMoreMenuOpen ? 'bg-gray-100 text-gray-600' : ''}`}
              title="更多"
            >
              <MoreHorizontal className={`w-4 h-4 ${isMoreMenuOpen ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>

            {/* 更多操作菜单 */}
            {isMoreMenuOpen && (
              <div
                ref={moreMenuRef}
                className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="px-1.5 space-y-0.5">
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Plus className="w-4 h-4 text-gray-400" />
                    <span>添加子任务</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Link className="w-4 h-4 text-gray-400" />
                    <span>关联主任务</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <ArrowUpToLine className="w-4 h-4 text-gray-400" />
                    <span>置顶</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Archive className="w-4 h-4 text-gray-400" />
                    <span>放弃</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span>标签</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Plus className="w-4 h-4 text-gray-400" />
                    <span>上传附件</span>
                  </button>
                  
                  <div className="h-[1px] bg-gray-50 my-1 mx-2" />
                  
                  <button type="button" className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors group">
                    <div className="flex items-center gap-3">
                      <Play className="w-4 h-4 text-gray-400" />
                      <span>开始专注</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                  
                  <div className="h-[1px] bg-gray-50 my-1 mx-2" />
                  
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <History className="w-4 h-4 text-gray-400" />
                    <span>任务动态</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Save className="w-4 h-4 text-gray-400" />
                    <span>保存为模板</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Copy className="w-4 h-4 text-gray-400" />
                    <span>创建副本</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Link className="w-4 h-4 text-gray-400" />
                    <span>复制链接</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>转换为笔记</span>
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                    <Printer className="w-4 h-4 text-gray-400" />
                    <span>打印</span>
                  </button>
                  
                  <div className="h-[1px] bg-gray-50 my-1 mx-2" />
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      handleDelete();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSelectedTaskId(null)}
            type="button"
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* 标题 */}
        <div className="space-y-3">
          <div className="flex-1 min-w-0">
            {isEditingTitle && !isTrashView ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editTitleValue}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="w-full text-[18px] font-bold text-gray-800 leading-snug outline-none bg-transparent"
              />
            ) : (
              <h3
                onClick={handleTitleStartEdit}
                className={`text-[18px] font-bold text-gray-800 leading-snug break-words ${isTrashView ? 'text-gray-400 cursor-default' : 'cursor-text hover:bg-gray-50 -mx-1 px-1 rounded transition-colors'
                  } ${task.completed ? 'text-gray-400' : ''}`}
                title={isTrashView ? '' : "点击修改标题"}
              >
                {task.title || (isEditingTitle ? '' : '无标题任务')}
              </h3>
            )}
          </div>
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
        <div className="space-y-2 relative">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-tighter">
            <AlignLeft className="w-3.5 h-3.5" />
            <span>描述</span>
          </div>
          <div 
            className={`min-h-[60px] p-2 -mx-2 hover:bg-gray-50 rounded-md transition-colors cursor-text group ${isEditingDescription ? 'bg-white' : ''}`}
            onClick={() => setIsEditingDescription(true)}
          >
            {isEditingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={descriptionValue}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="输入内容或使用 / 快速插入"
                className="w-full min-h-[100px] bg-transparent outline-none text-[13px] text-gray-700 leading-relaxed resize-none placeholder:text-gray-300"
              />
            ) : task.description ? (
              <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-[13px] text-gray-300 italic">点此添加详细描述...</p>
            )}
          </div>

          {/* Slash Context Menu */}
          {isSlashMenuOpen && (
            <div 
              ref={slashMenuRef}
              className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-1.5 z-[60] animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="overflow-y-auto custom-scrollbar">
                {slashMenuItems.map((item, index) => {
                  const showDivider = index > 0 && slashMenuItems[index-1].section !== item.section;
                  return (
                    <div key={item.label}>
                      {showDivider && <div className="h-[1px] bg-gray-50 my-1 mx-2" />}
                      <button
                        onClick={() => handleSlashItemClick(item.label)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                          <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#1890FF]" />
                        </div>
                        <span className="text-[12px] text-gray-600 group-hover:text-gray-900">{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 标签展示区 - 移动到描述下方 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-tighter">
            <Hash className="w-3.5 h-3.5" />
            <span>标签</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 relative">
            {Array.isArray(task.tags) && task.tags
              .map(tagId => ({ tagId, tagInfo: (allTags || []).find(t => t.id === tagId) }))
              .filter(item => item.tagInfo)
              .map(({ tagId, tagInfo }) => {
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium group cursor-default transition-colors"
                    style={{ 
                      color: tagInfo!.color, 
                      backgroundColor: `${tagInfo!.color}15`,
                      border: `1px solid ${tagInfo!.color}20`
                    }}
                  >
                    <Hash className="w-3 h-3 mr-0.5 opacity-70" style={{ color: tagInfo!.color }} />
                    {tagInfo!.name}
                    {!isTrashView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTag(tagId);
                        }}
                        className="ml-1 hover:opacity-100 opacity-40 transition-opacity"
                        style={{ color: tagInfo!.color }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                );
              })}
            {!isTrashView && (
              <>
                <button
                  ref={tagTriggerRef}
                  onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
                  className="inline-flex items-center px-1.5 py-0.5 text-gray-400 hover:text-[#1890FF] hover:bg-blue-50 rounded transition-colors"
                  title="添加标签"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* 标签简易选择器 Popover - 移动到按钮旁边 */}
                {isTagPopoverOpen && (
                  <div
                    ref={tagPopoverRef}
                    className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-gray-100 shadow-xl rounded-lg p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        ref={tagSearchInputRef}
                        type="text"
                        value={tagSearchValue}
                        onChange={(e) => setTagSearchValue(e.target.value)}
                        placeholder="快速搜索或创建标签"
                        className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border-none rounded-md text-[13px] outline-none placeholder:text-gray-300 focus:bg-gray-100 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && showCreateOption) {
                            handleCreateAndAddTag();
                          }
                        }}
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredTags.map(tag => (
                        <div
                          key={tag.id}
                          onClick={() => handleToggleTag(tag.id)}
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-[#F0F7FF] rounded-md cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#CBD5E0' }} />
                            <span className="text-[13px] text-gray-700">{tag.name}</span>
                          </div>
                        </div>
                      ))}

                      {showCreateOption && (
                        <div
                          onClick={handleCreateAndAddTag}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F7FF] rounded-md cursor-pointer transition-colors text-[#1890FF]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-[13px]">创建标签 "{tagSearchValue}"</span>
                        </div>
                      )}

                      {filteredTags.length === 0 && !showCreateOption && (
                        <div className="px-2 py-4 text-center text-xs text-gray-400 italic">
                          {tagSearchValue ? '未找到相关标签' : '暂无可用标签'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-[1px] bg-gray-100 -mx-6" />

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
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-white h-12 relative">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* 所属清单 */}
          <div className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors max-w-[150px]">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[13px] text-gray-500 truncate">
              {allLists?.find(l => l.id === task.list_id)?.name || '收集箱'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="排版"
          >
            <Type className="w-4 h-4 text-gray-400" />
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors relative"
            title="评论"
          >
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
