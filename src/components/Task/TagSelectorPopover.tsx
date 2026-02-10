import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Tag as TagIcon, 
  ChevronDown, 
  ChevronRight, 
  Check,
  Plus
} from 'lucide-react';
import { Tag } from '../../types';
import { useTags, useCreateTag } from '../../hooks/useTags';
import { getRandomTagColor } from '../../constants/colors';

interface TagSelectorPopoverProps {
  selectedTagIds: string[];
  onConfirm: (tagIds: string[]) => void;
  onCancel: () => void;
}

interface TagNode extends Tag {
  children: TagNode[];
}

export default function TagSelectorPopover({ 
  selectedTagIds: initialSelectedTagIds, 
  onConfirm, 
  onCancel 
}: TagSelectorPopoverProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialSelectedTagIds);
  const [searchValue, setSearchValue] = useState('');
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const removeTag = (tagId: string) => {
    setSelectedTagIds(prev => prev.filter(id => id !== tagId));
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

  const tagTree = useMemo(() => {
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

  const filteredTags = useMemo(() => {
    if (!searchValue.trim()) return tagTree;
    
    const filter = (nodes: TagNode[]): TagNode[] => {
      return nodes.reduce((acc: TagNode[], node) => {
        const matches = node.name.toLowerCase().includes(searchValue.toLowerCase());
        const childrenMatches = filter(node.children);
        
        if (matches || childrenMatches.length > 0) {
          acc.push({ ...node, children: childrenMatches });
        }
        return acc;
      }, []);
    };
    
    return filter(tagTree);
  }, [tagTree, searchValue]);

  const selectedTagsData = useMemo(() => {
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;
    
    try {
      const newTag = await createTag.mutateAsync({ 
        name: searchValue.trim(), 
        color: getRandomTagColor() 
      });
      
      if (newTag) {
        toggleTagSelection(newTag.id);
        setSearchValue('');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const renderTagItem = (node: TagNode, level: number = 0) => {
    const isExpanded = expandedTagIds.has(node.id) || searchValue !== '';
    const hasChildren = node.children.length > 0;
    const isSelected = selectedTagIds.includes(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <button
          onClick={() => toggleTagSelection(node.id)}
          className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors group"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
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
              <TagIcon className="w-4 h-4 text-[var(--dida-text-tertiary)] shrink-0" />
            </div>
            <span className="text-[13px] text-[var(--dida-text-secondary)] truncate">{node.name}</span>
          </div>
          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--dida-primary)] shrink-0" />}
        </button>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map(child => renderTagItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const showCreateOption = searchValue.trim() !== '' && !tags.some(t => t.name.toLowerCase() === searchValue.toLowerCase().trim());

  return (
    <div className="w-[240px] flex flex-col max-h-[400px]">
      {/* 头部：已选标签和搜索 */}
      <div className="p-2 border-b border-[var(--dida-border-light)]">
        <div className="flex flex-wrap gap-1.5 mb-2 max-h-[100px] overflow-y-auto">
          {selectedTagsData.map(tag => (
            <div 
              key={tag.id}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(var(--dida-primary-rgb),0.1)] text-[var(--dida-primary)] rounded text-[12px] group"
            >
              <span className="truncate max-w-[80px]">{tag.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                className="hover:bg-[rgba(var(--dida-primary-rgb),0.2)] rounded-sm transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex-1 min-w-[60px] relative">
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  handleCreateTag();
                }
              }}
              placeholder={selectedTagIds.length === 0 ? "输入标签" : ""}
              className="w-full text-[13px] outline-none py-0.5 placeholder:text-[var(--dida-text-tertiary)]"
            />
          </div>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
        {filteredTags.length > 0 ? (
          filteredTags.map(node => renderTagItem(node))
        ) : !showCreateOption && (
          <div className="py-4 text-center text-[12px] text-[var(--dida-text-tertiary)]">
            无匹配标签
          </div>
        )}

        {showCreateOption && (
          <button
            onClick={handleCreateTag}
            className="w-full flex items-center gap-2 py-2 px-2 hover:bg-[var(--dida-bg-hover)] text-[var(--dida-primary)] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[13px]">创建标签 "{searchValue}"</span>
          </button>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="p-2 border-t border-[var(--dida-border-light)] flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-[13px] text-[var(--dida-text-secondary)] hover:bg-[var(--dida-bg-hover)] rounded transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(selectedTagIds)}
          className="px-3 py-1 text-[13px] bg-[var(--dida-primary)] text-white hover:bg-[var(--dida-primary-dark)] rounded transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}
