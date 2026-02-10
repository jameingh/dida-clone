import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    children: React.ReactNode;
}

export default function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = React.useState({ left: x, top: y });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // 监听滚动和点击，关闭菜单
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', onClose, { capture: true });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', onClose, { capture: true });
        };
    }, [onClose]);

    // 边界检查：确保不超出窗口
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let adjustedX = x;
            let adjustedY = y;

            // 检查右侧边界
            if (x + rect.width > window.innerWidth) {
                adjustedX = window.innerWidth - rect.width - 8;
            }

            // 检查底部边界
            if (y + rect.height > window.innerHeight) {
                adjustedY = window.innerHeight - rect.height - 8;
            }

            // 确保不超出左侧和顶部
            adjustedX = Math.max(8, adjustedX);
            adjustedY = Math.max(8, adjustedY);

            setPos({ left: adjustedX, top: adjustedY });
        }
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white border border-gray-100 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden min-w-[160px]"
            style={{ left: pos.left, top: pos.top }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
        </div>
    );
}

interface ContextMenuItemProps {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    active?: boolean;
}

export function ContextMenuItem({
    icon,
    label,
    onClick,
    danger = false,
    active = false
}: ContextMenuItemProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-[13px] transition-colors ${active
                    ? 'bg-blue-50 text-blue-600'
                    : danger
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-50'
                }`}
        >
            {icon && <span className={`${active ? 'text-blue-500' : 'text-gray-400'}`}>{icon}</span>}
            <span className="flex-1 text-left font-medium">{label}</span>
        </button>
    );
}

export function ContextMenuSeparator() {
    return <div className="h-px bg-gray-100 my-1 mx-1" />;
}
