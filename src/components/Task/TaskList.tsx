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
import { Plus, Calendar, ChevronDown, MoreHorizontal, Flag, Hash, X, Check, Trash2 } from 'lucide-react';
import { useTasks, useCreateTaskExtended, useUpdateTaskOrders, useEmptyTrash } from '../../hooks/useTasks';
import { useTags, useCreateTag, useUpdateTag } from '../../hooks/useTags';
import { useLists } from '../../hooks/useLists';
import { Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useAlertStore } from '../../store/useAlertStore';
import TaskItem from './TaskItem';
import DatePicker from '../Common/DatePicker';

export default function TaskList() {
  const { selectedListId, selectedTagId } = useAppStore();
  const { data: tasks } = useTasks(selectedListId || undefined, selectedTagId || undefined);
  const { data: allTags } = useTags();
  const { data: lists } = useLists();
  const createTask = useCreateTaskExtended();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const updateTaskOrders = useUpdateTaskOrders();
  const emptyTrash = useEmptyTrash();
  const { showAlert } = useAlertStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<number | undefined>();
  const [newTaskPriority, setNewTaskPriority] = useState<number | undefined>();
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);

  // 标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  
  // 当切换标签时，重置标题输入框
  useEffect(() => {
    if (selectedTagId && allTags) {
      const tag = allTags.find(t => t.id === selectedTagId);
      if (tag) {
        setTitleInputValue(tag.name);
      }
    }
  }, [selectedTagId, allTags]);

  const handleTitleSave = () => {
    if (selectedTagId && allTags && titleInputValue.trim()) {
      const tag = allTags.find(t => t.id === selectedTagId);
      if (tag && tag.name !== titleInputValue.trim()) {
        updateTag.mutate({ ...tag, name: titleInputValue.trim() });
      }
    }
    setIsEditingTitle(false);
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

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

  // 点击外部关闭弹层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showDatePicker || showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showMoreMenu]);

  // 日期格式化函数
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}月${day}日, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && selectedListId) {
      let title = newTaskTitle.trim();
      const tagsToAssign = new Set(newTaskTags);

      // 解析标题中的标签 (例如 "#工作")
      const tagMatches = title.match(/#(\S+)/g);
      if (tagMatches) {
        for (const match of tagMatches) {
          const tagName = match.substring(1); // 移除 #
          // 查找现有标签
          const existingTag = allTags?.find(t => t.name === tagName);
          
          if (existingTag) {
            tagsToAssign.add(existingTag.id);
          } else {
            // 创建新标签
            try {
               const newTag = await createTag.mutateAsync({ name: tagName, color: '#87d068' });
               tagsToAssign.add(newTag.id);
            } catch (error) {
               console.error('Failed to create tag:', error);
            }
          }
          
          // 从标题中移除标签文本
          title = title.replace(match, '').trim();
        }
      }

      // 如果移除标签后标题为空，恢复原标题（或者根据需求保留空标题但通常不允许）
      // 这里如果只输入了 #tag，可能标题就为空了。滴答清单允许这种情况吗？通常需要一个标题。
      // 如果为空，我们保留原标题，但仍然关联标签。
      if (!title) {
        title = newTaskTitle.trim();
      }

      createTask.mutate({
        title: title,
        listId: selectedListId,
        dueDate: newTaskDueDate,
        priority: newTaskPriority,
        tags: Array.from(tagsToAssign),
        description: undefined,
      });
      setNewTaskTitle('');
      setNewTaskDueDate(undefined);
      setNewTaskPriority(undefined);
      setNewTaskTags([]);
      setShowDatePicker(false);
      setShowMoreMenu(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setNewTaskTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 3: return 'text-red-500';
      case 2: return 'text-yellow-500';
      case 1: return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const getPriorityLabel = (priority?: number) => {
    switch (priority) {
      case 3: return '高';
      case 2: return '中';
      case 1: return '低';
      default: return '无';
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
    if (!over || active.id === over.id || isTrashView) return;

    const oldIndex = localTasks.findIndex((t) => t.id === active.id);
    const newIndex = localTasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(localTasks, oldIndex, newIndex);
    setLocalTasks(newTasks);

    const ascendingOrders: [string, number][] = newTasks.map((t, index) => [
      t.id,
      index * 10,
    ]);

    updateTaskOrders.mutate(ascendingOrders);
  };

  const incompleteTasks = localTasks.filter((task) => !task.completed);
  const completedTasks = localTasks.filter((task) => task.completed);
  const isTrashView = selectedListId === 'smart_trash';
  // 已选属性是否存在的标记
  const hasAttributes = newTaskDueDate || newTaskPriority !== undefined || newTaskTags.length > 0;

  const handleEmptyTrash = () => {
    showAlert({
      title: '清空垃圾桶',
      message: '确定要清空垃圾桶吗？所有任务都将永久删除。',
      type: 'error',
      confirmLabel: '清空',
      onConfirm: () => {
        emptyTrash.mutate();
      }
    });
  };

  // 计算当前视图标题
  let viewTitle = '';
  if (selectedTagId && allTags) {
    const tag = allTags.find(t => t.id === selectedTagId);
    if (tag) viewTitle = tag.name;
  } else if (selectedListId && lists) {
    const list = lists.find(l => l.id === selectedListId);
    if (list) viewTitle = list.name;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {selectedTagId ? (
            isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={titleInputValue}
                onChange={(e) => setTitleInputValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-2xl font-bold text-gray-800 outline-none border-b-2 border-[#1890FF] pb-1 bg-transparent"
              />
            ) : (
              <h1
                onClick={() => {
                  setTitleInputValue(viewTitle);
                  setIsEditingTitle(true);
                }}
                className="text-2xl font-bold text-gray-800 cursor-text hover:bg-gray-50 px-1 -mx-1 rounded transition-colors"
                title="点击修改标签名称"
              >
                # {viewTitle}
              </h1>
            )
          ) : (
            <h1 className="text-2xl font-bold text-gray-800">{viewTitle}</h1>
          )}
        </div>
      </div>

      {/* 垃圾桶顶部操作栏 */}
      {isTrashView && localTasks.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-[12px] text-gray-400">
            任务将在垃圾桶中保留 7 天
          </div>
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-red-500 hover:bg-red-50 rounded transition-colors font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空垃圾桶
          </button>
        </div>
      )}

      {/* 顶部快速添加栏 - 垃圾桶视图下隐藏 */}
      {!isTrashView && (
        <div className="px-4 py-3 shrink-0">
          <form onSubmit={handleAddTask} className="relative">
            <div className={`flex flex-col bg-[#F5F5F5] focus-within:bg-white border border-transparent focus-within:border-gray-200 rounded transition-all group ${hasAttributes ? 'pb-2' : ''}`}>
              {/* 输入区域 */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Plus className={`w-5 h-5 transition-colors shrink-0 ${newTaskPriority ? getPriorityColor(newTaskPriority) : 'text-gray-400 group-focus-within:text-[#1890FF]'}`} />
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="添加任务... (输入 #添加标签)"
                  className="flex-1 bg-transparent text-[14px] text-gray-700 outline-none placeholder:text-gray-400"
                />

                {/* 右侧按钮组 */}
                <div className="flex items-center gap-1">
                  {/* 更多按钮 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* 更多菜单浮层 */}
                    {showMoreMenu && (
                      <div ref={moreMenuRef} className="absolute top-full right-0 mt-2 w-64 bg-white shadow-xl rounded-lg border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                        {/* 优先级选择 */}
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-2">优先级</div>
                          <div className="flex gap-2">
                            {[3, 2, 1, 0].map((p) => {
                              const isSelected = newTaskPriority === (p === 0 ? undefined : p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  aria-label={p === 0 ? '无优先级' : getPriorityLabel(p) + '优先级'}
                                  onClick={() => {
                                    setNewTaskPriority(p === 0 ? undefined : p);
                                    setShowMoreMenu(false);
                                  }}
                                  className={`flex-1 flex items-center justify-center py-1.5 rounded text-sm hover:bg-gray-50 border transition-all ${isSelected ? 'border-[#1890FF] bg-blue-50' : 'border-transparent'}`}
                                >
                                  {p === 0 ? '无' : (
                                    <Flag className={`w-4 h-4 ${getPriorityColor(p)}`} fill="currentColor" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 标签选择 */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">标签</div>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {allTags?.map((tag) => {
                              const isSelected = newTaskTags.includes(tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  aria-label={'选择标签 ' + tag.name}
                                  onClick={() => toggleTag(tag.id)}
                                  className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${isSelected ? 'bg-blue-50 text-[#1890FF] border-[#1890FF]' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                  {tag.name}
                                </button>
                              );
                            })}
                            {(!allTags || allTags.length === 0) && (
                              <div className="text-xs text-gray-400 w-full text-center py-2">暂无标签</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
              </div>

              {/* 属性展示 Chips */}
              {hasAttributes && (
                <div className="flex flex-wrap gap-2 px-10 pb-1">
                  {/* 优先级 Chip */}
                  {newTaskPriority !== undefined && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100/50 hover:bg-gray-100 cursor-default ${getPriorityColor(newTaskPriority)}`}>
                      <Flag className="w-3 h-3" fill="currentColor" />
                      {getPriorityLabel(newTaskPriority)}
                      <button
                        type="button"
                        onClick={() => setNewTaskPriority(undefined)}
                        className="ml-1 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* 标签 Chips */}
                  {newTaskTags.map(tagId => {
                    const tag = allTags?.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span key={tagId} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-50 text-[#1890FF] hover:bg-blue-100 cursor-default">
                        <Hash className="w-3 h-3" />
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => toggleTag(tagId)}
                          className="ml-1 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

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
            <div className="text-5xl mb-4">{isTrashView ? '🗑️' : '✨'}</div>
            <div className="text-[13px] font-medium">{isTrashView ? '垃圾桶是空的' : '今天没有任务，享受生活吧'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
