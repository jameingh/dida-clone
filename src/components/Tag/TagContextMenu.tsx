import { useRef } from 'react';
import { Edit2, ArrowUp, Plus, Merge, Share2, Trash2 } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface TagContextMenuProps {
  x: number;
  y: number;
  isPinned?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPin: () => void;
  onAddSubTag: () => void;
  onMerge: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export default function TagContextMenu({
  x,
  y,
  isPinned,
  onClose,
  onEdit,
  onPin,
  onAddSubTag,
  onMerge,
  onShare,
  onDelete,
}: TagContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside([menuRef], onClose, true);

  // 确保菜单不超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const menuItems = [
    { label: '编辑', icon: <Edit2 className="w-4 h-4" />, onClick: onEdit },
    { label: isPinned ? '取消置顶' : '置顶', icon: <ArrowUp className={`w-4 h-4 ${isPinned ? 'rotate-180' : ''}`} />, onClick: onPin },
    { label: '添加子标签', icon: <Plus className="w-4 h-4" />, onClick: onAddSubTag },
    { label: '合并标签到...', icon: <Merge className="w-4 h-4" />, onClick: onMerge },
    { label: '移动至共享标签', icon: <Share2 className="w-4 h-4" />, onClick: onShare },
    { label: '删除', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] w-48 bg-white rounded-xl shadow-2xl border border-[var(--dida-border-light)] py-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-[14px] transition-colors ${
            item.danger
              ? 'text-red-500 hover:bg-red-50'
              : 'text-[var(--dida-text-main)] hover:bg-[var(--dida-bg-hover)]'
          }`}
        >
          <span className={item.danger ? 'text-red-500' : 'text-[var(--dida-text-tertiary)]'}>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
