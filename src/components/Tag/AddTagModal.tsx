import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useCreateTag, useUpdateTag, useTags } from '../../hooks/useTags';
import { Tag } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { TAG_PRESET_COLORS } from '../../constants/colors';

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagToEdit?: Tag | null;
  initialParentId?: string | null;
}

export default function AddTagModal({ isOpen, onClose, tagToEdit, initialParentId }: AddTagModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('var(--dida-tag-default)');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const { data: tags } = useTags();

  useClickOutside([dropdownRef], () => setIsDropdownOpen(false), isDropdownOpen);

  useEffect(() => {
    if (isOpen) {
      if (tagToEdit) {
        setName(tagToEdit.name);
        setSelectedColor(tagToEdit.color || 'var(--dida-tag-default)');
        setParentId(tagToEdit.parent_id || null);
      } else {
        setName('');
        setSelectedColor('var(--dida-tag-default)');
        setParentId(initialParentId || null);
      }
    }
  }, [isOpen, tagToEdit, initialParentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (tagToEdit) {
        updateTag.mutate({
          ...tagToEdit,
          name: name.trim(),
          color: selectedColor,
          parent_id: parentId,
        });
      } else {
        createTag.mutate({
          name: name.trim(),
          color: selectedColor,
          parentId: parentId,
        });
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--dida-border-light)]">
          <h2 className="text-[17px] font-bold text-[var(--dida-text-main)]">{tagToEdit ? '编辑标签' : '添加标签'}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[var(--dida-bg-hover)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--dida-text-tertiary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div className="space-y-1.5">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名称"
              className="w-full px-4 py-2.5 bg-white border border-[var(--dida-border-light)] focus:border-[var(--dida-primary)] rounded-xl outline-none transition-all placeholder:text-[var(--dida-text-tertiary)] text-[15px]"
            />
          </div>

          {/* Color Selection */}
          <div className="flex items-center gap-4">
            <span className="text-[14px] text-[var(--dida-text-secondary)] min-w-[60px]">颜色</span>
            <div className="flex items-center gap-2.5">
              {/* No color option */}
              <button
                type="button"
                onClick={() => setSelectedColor('var(--dida-tag-default)')}
                className={`w-6 h-6 rounded-full border flex items-center justify-center relative ${selectedColor === 'var(--dida-tag-default)' ? 'ring-2 ring-offset-2 ring-[var(--dida-border-light)]' : 'border-[var(--dida-border-light)]'}`}
              >
                <div className="w-full h-[1px] bg-red-400 rotate-45 absolute"></div>
              </button>
              
              {TAG_PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-[var(--dida-border-light)]' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              
              {/* Custom color picker */}
              <div className="relative group">
                <div
                  className="w-6 h-6 rounded-full border border-[var(--dida-border-light)] bg-gradient-to-tr from-red-400 via-green-400 to-blue-400 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                >
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Parent Tag Selection */}
          <div className="flex items-center gap-4 relative">
            <span className="text-[14px] text-[var(--dida-text-secondary)] min-w-[60px]">上级标签</span>
            <div className="flex-1 relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-[var(--dida-border-light)] hover:border-[var(--dida-text-tertiary)] rounded-lg transition-colors text-[14px] text-[var(--dida-text-main)]"
              >
                <span>{parentId ? tags?.find(t => t.id === parentId)?.name : '无'}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--dida-text-tertiary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[var(--dida-border-light)] shadow-xl rounded-xl py-1 z-[110] max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setParentId(null);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-left text-[14px] hover:bg-[var(--dida-bg-hover)]"
                  >
                    <span>无</span>
                    {!parentId && <Check className="w-4 h-4 text-[var(--dida-primary)]" />}
                  </button>
                  {tags?.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setParentId(tag.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 text-left text-[14px] hover:bg-[var(--dida-bg-hover)]"
                    >
                      <span>{tag.name}</span>
                      {parentId === tag.id && <Check className="w-4 h-4 text-[var(--dida-primary)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[14px] text-[var(--dida-text-secondary)] hover:bg-[var(--dida-bg-hover)] rounded-xl transition-colors"
            >
              关闭
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 text-[14px] text-white bg-[var(--dida-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium shadow-sm shadow-blue-200"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}