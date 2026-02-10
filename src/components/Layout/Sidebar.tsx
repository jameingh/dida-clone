import { useState, useMemo, useRef, useEffect } from 'react';
import { useLists, useCreateList } from '../../hooks/useLists';
import { useTags } from '../../hooks/useTags';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Hash, ChevronDown, ChevronRight, MoreHorizontal, Check } from 'lucide-react';
import AddTagModal from '../Tag/AddTagModal';
import TagContextMenu from '../Tag/TagContextMenu';
import { Tag } from '../../types';
import { useDeleteTag, useUpdateTag } from '../../hooks/useTags';
import { useAlertStore } from '../../store/useAlertStore';
import { SMART_LIST_CONFIG } from '../../constants/smartLists';
import { useClickOutside } from '../../hooks/useClickOutside';

interface TagNode extends Tag {
  children: TagNode[];
}

interface SidebarProps {
  width?: number;
}

export default function Sidebar({ width = 240 }: SidebarProps) {
  const { data: lists, isLoading: isListsLoading } = useLists();
  const createList = useCreateList();
  const { data: tags, isLoading: isTagsLoading } = useTags();
  const { selectedListId, setSelectedListId, selectedTagId, setSelectedTagId } = useAppStore();
  const deleteTag = useDeleteTag();
  const updateTag = useUpdateTag();
  const { showAlert } = useAlertStore();

  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [initialParentId, setInitialParentId] = useState<string | null>(null);

  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(new Set());

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const newListInputRef = useRef<HTMLInputElement>(null);
  const newListContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside([newListContainerRef], () => {
    if (isAddingList) setIsAddingList(false);
  }, isAddingList);

  useEffect(() => {
    if (isAddingList) {
      newListInputRef.current?.focus();
    }
  }, [isAddingList]);

  const handleCreateList = () => {
    if (!newListTitle.trim()) {
      setIsAddingList(false);
      return;
    }

    createList.mutate({
      id: crypto.randomUUID(),
      name: newListTitle.trim(),
      icon: '📋',
      color: 'var(--dida-primary)',
      is_smart: false,
      order: (lists?.length || 0),
      created_at: Math.floor(Date.now() / 1000),
    }, {
      onSuccess: () => {
        setIsAddingList(false);
        setNewListTitle('');
      }
    });
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tag: Tag } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tag });
  };

  const handleTogglePin = (tag: Tag) => {
    updateTag.mutate({
      ...tag,
      is_pinned: !tag.is_pinned,
    });
  };

  const handleDeleteTag = (tag: Tag) => {
    showAlert({
      title: '删除标签',
      message: `删除后，所有任务中的标签 "${tag.name}" 都将被移除，此操作不可撤销。`,
      type: 'error',
      confirmLabel: '删除',
      onConfirm: () => {
        deleteTag.mutate(tag.id);
        if (selectedTagId === tag.id) {
          setSelectedTagId(null);
        }
      },
    });
  };

  const toggleTagExpanded = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const getSmartListIcon = (id: string, isSelected: boolean) => {
    const config = SMART_LIST_CONFIG[id as keyof typeof SMART_LIST_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Icon 
        className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-[var(--dida-primary)]' : 'text-gray-500'}`}
        strokeWidth={isSelected ? 2.5 : 2}
      />
    );
  };

  const tagTree = useMemo(() => {
    if (!tags) return [];
    const map = new Map<string, TagNode>();
    const roots: TagNode[] = [];

    tags.forEach(tag => {
      map.set(tag.id, { ...tag, children: [] });
    });

    tags.forEach(tag => {
      const node = map.get(tag.id)!;
      if (tag.parent_id && map.has(tag.parent_id)) {
        map.get(tag.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [tags]);

  const renderTag = (node: TagNode, level: number = 0) => {
    const isExpanded = expandedTagIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedTagId === node.id;

    return (
      <div key={node.id} className="flex flex-col">
        <button
          onClick={() => setSelectedTagId(node.id)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`w-full flex items-center justify-between py-1.5 rounded-md transition-colors group ${isSelected
            ? 'bg-[var(--dida-primary-light)] text-[var(--dida-primary)]'
            : 'text-[var(--dida-text-main)] hover:bg-[var(--dida-bg-hover)]'
            }`}
          style={{ paddingLeft: `${level * 16 + 12}px`, paddingRight: '12px' }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center">
              {hasChildren ? (
                <div 
                  onClick={(e) => toggleTagExpanded(node.id, e)}
                  className="w-4 h-4 flex items-center justify-center hover:bg-[var(--dida-border-light)] rounded transition-colors mr-1"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              ) : (
                <div className="w-5" /> 
              )}
              <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--dida-primary)]' : 'text-[var(--dida-text-tertiary)]'}`} />
            </div>
            <span className={`text-sm truncate ${isSelected ? 'font-semibold' : 'font-medium'}`}>{node.name}</span>
          </div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color || 'var(--dida-tag-default)' }} />
        </button>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map(child => renderTag(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isLoading = isListsLoading || isTagsLoading;
  const isInitialLoading = isLoading && !lists && !tags;

  const smartLists = useMemo(() => {
    const filtered = (lists || []).filter((list) => list.is_smart);
    console.log('Sidebar render - lists:', lists);
    console.log('Sidebar render - smartLists count:', filtered.length);
    console.log('Sidebar render - smartLists IDs:', filtered.map(l => l.id));
    return filtered;
  }, [lists]);

  const customLists = useMemo(() => lists?.filter((list) => !list.is_smart) || [], [lists]);
  const pinnedTags = useMemo(() => tags?.filter((tag) => tag.is_pinned) || [], [tags]);

  // 如果后端没有返回任何清单（包括智能清单），可能是还在加载或初始化
  const hasSmartLists = smartLists.length > 0;

  // 只在首次进入应用时显示“加载中”，后续切换保持界面内容不闪烁
  if (isInitialLoading) {
    return (
      <aside 
        className="bg-white border-r border-[var(--dida-border-light)] p-4 shrink-0"
        style={{ width: `${width}px` }}
      >
        <div className="text-sm text-[var(--dida-text-secondary)]">加载中...</div>
      </aside>
    );
  }

  return (
    <aside 
      className="bg-[var(--dida-sidebar)] border-r border-[var(--dida-border-light)] flex flex-col pt-4 overflow-y-auto shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="flex-1 px-2">
        {/* 置顶标签区域 */}
        {pinnedTags.length > 0 && (
          <div className="mb-6 grid grid-cols-4 gap-1 px-1">
            {pinnedTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTagId(tag.id)}
                onContextMenu={(e) => handleContextMenu(e, tag)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all hover:bg-[var(--dida-bg-hover)] border border-transparent group ${
                  selectedTagId === tag.id ? 'bg-white shadow-sm border-[var(--dida-border-light)]' : ''
                }`}
                title={tag.name}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition-colors bg-white shadow-sm border border-[var(--dida-border-light)] group-hover:border-[var(--dida-border-light)]"
                >
                  <Hash className="w-4 h-4" style={{ color: tag.color }} />
                </div>
                <span className="text-[10px] font-medium text-[var(--dida-text-secondary)] truncate w-full text-center px-0.5">
                  {tag.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 智能清单 */}
        <div className="mb-2 space-y-0.5">
          {!hasSmartLists && !isListsLoading && (
            <div className="px-3 py-2 text-xs text-[var(--dida-text-tertiary)] italic">初始化清单中...</div>
          )}
          {smartLists.map((list) => {
            const isSelected = selectedListId === list.id;
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors group ${isSelected
                  ? 'bg-[var(--dida-primary-light)] text-[var(--dida-primary)]'
                  : 'text-[var(--dida-text-main)] hover:bg-[var(--dida-bg-hover)]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getSmartListIcon(list.id, isSelected)}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                    {list.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 自定义清单 */}
        <div className="mt-6">
          <div className="px-3 py-2 flex items-center justify-between group cursor-pointer hover:bg-[var(--dida-bg-hover)] rounded-md">
            <div className="text-[11px] font-bold text-[var(--dida-text-tertiary)] uppercase tracking-wider">
              我的清单
            </div>
            <button
              onClick={() => setIsAddingList(true)}
              className="text-[var(--dida-text-tertiary)] hover:text-[var(--dida-primary)] opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
              title="新建清单"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 mt-0.5">
            {isAddingList && (
              <div ref={newListContainerRef} className="px-3 py-1.5 flex items-center gap-2">
                <input
                  ref={newListInputRef}
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateList();
                    if (e.key === 'Escape') setIsAddingList(false);
                  }}
                  placeholder="清单名称"
                  className="flex-1 bg-white border border-[var(--dida-primary)] rounded px-2 py-1 text-sm outline-none"
                />
                <button 
                  onClick={handleCreateList}
                  className="p-1 text-[var(--dida-primary)] hover:bg-[var(--dida-primary-light)] rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {customLists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors ${selectedListId === list.id
                  ? 'bg-[var(--dida-primary-light)] text-[var(--dida-primary)]'
                  : 'text-[var(--dida-text-main)] hover:bg-[var(--dida-bg-hover)]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-5 h-5 flex items-center justify-center">{list.icon}</span>
                  <span className={`text-sm ${selectedListId === list.id ? 'font-semibold' : 'font-medium'}`}>
                    {list.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 标签列表 */}
        <div className="mt-6">
          <div 
            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
            className="px-1 py-1.5 flex items-center justify-between group cursor-pointer hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors"
          >
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-5 flex items-center justify-center text-[var(--dida-text-tertiary)]">
                {isTagsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              <div className="text-[12px] font-bold text-[var(--dida-text-tertiary)] tracking-wider">
                标签
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)] opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-[var(--dida-border-light)]"
                title="更多操作"
                onClick={(e) => {
                  e.stopPropagation();
                  // 更多操作逻辑
                }}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddTagModalOpen(true);
                }}
                className="text-[var(--dida-text-tertiary)] hover:text-[var(--dida-primary)] opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-[var(--dida-border-light)]"
                title="新建标签"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {isTagsExpanded && (
            <div className="space-y-0.5 mt-0.5">
              {tagTree.map((node) => renderTag(node))}

              {tagTree.length === 0 && (
                <div className="px-3 py-2 text-xs text-[var(--dida-text-tertiary)] italic">暂无标签</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <AddTagModal 
        isOpen={isAddTagModalOpen} 
        onClose={() => {
          setIsAddTagModalOpen(false);
          setTagToEdit(null);
          setInitialParentId(null);
        }} 
        tagToEdit={tagToEdit}
        initialParentId={initialParentId}
      />

      {contextMenu && (
        <TagContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={contextMenu.tag.is_pinned}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            setTagToEdit(contextMenu.tag);
            setIsAddTagModalOpen(true);
          }}
          onPin={() => handleTogglePin(contextMenu.tag)}
          onAddSubTag={() => {
            setInitialParentId(contextMenu.tag.id);
            setTagToEdit(null);
            setIsAddTagModalOpen(true);
          }}
          onMerge={() => {
            // 实现合并逻辑
            console.log('Merge tag:', contextMenu.tag.id);
          }}
          onShare={() => {
            // 实现共享逻辑
            console.log('Share tag:', contextMenu.tag.id);
          }}
          onDelete={() => handleDeleteTag(contextMenu.tag)}
        />
      )}
    </aside>
  );
}
