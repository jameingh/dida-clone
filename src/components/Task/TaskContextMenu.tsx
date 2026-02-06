import React from 'react';
import { 
  Sun, 
  Sunrise, 
  CalendarDays, 
  CalendarRange, 
  Calendar, 
  Flag, 
  ListTree, 
  Link2, 
  ArrowUpToLine, 
  XCircle, 
  FolderInput, 
  Tag as TagIcon, 
  Target, 
  Copy, 
  Link, 
  FileText, 
  Trash2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Task, Priority } from '../../types';
import ContextMenu, { ContextMenuSeparator } from '../Common/ContextMenu';

interface TaskContextMenuProps {
  x: number;
  y: number;
  task: Task;
  isTrashView?: boolean;
  onClose: () => void;
  onSetPriority: (priority: Priority) => void;
  onSetDate: (days: number | null) => void;
  onDelete: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
  onAddSubtask: () => void;
}

export default function TaskContextMenu({
  x,
  y,
  task,
  isTrashView,
  onClose,
  onSetPriority,
  onSetDate,
  onDelete,
  onRestore,
  onDeletePermanently,
  onAddSubtask
}: TaskContextMenuProps) {
  if (isTrashView) {
    return (
      <ContextMenu x={x} y={y} onClose={onClose}>
        <div className="w-[180px] bg-white rounded-lg overflow-hidden py-1">
          <MenuItem 
            icon={<RotateCcw className="w-4 h-4" />} 
            label="恢复任务" 
            onClick={() => { onRestore?.(); onClose(); }} 
          />
          <MenuItem 
            icon={<XCircle className="w-4 h-4" />} 
            label="永久删除" 
            onClick={() => { onDeletePermanently?.(); onClose(); }} 
            danger 
          />
        </div>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <div className="w-[220px] bg-white rounded-lg overflow-hidden">
        {/* 日期部分 */}
        <div className="px-3 py-2">
          <div className="text-[11px] text-gray-400 mb-2">日期</div>
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => { onSetDate(0); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="今天"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { onSetDate(1); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="明天"
            >
              <Sunrise className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { onSetDate(7); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="下周"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { onSetDate(30); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="下月"
            >
              <CalendarRange className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
              title="选择日期"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ContextMenuSeparator />

        {/* 优先级部分 */}
        <div className="px-3 py-2">
          <div className="text-[11px] text-gray-400 mb-2">优先级</div>
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => { onSetPriority(Priority.High); onClose(); }}
              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${task.priority === Priority.High ? 'text-red-500 bg-red-50' : 'text-red-500'}`}
              title="高优先级"
            >
              <Flag className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => { onSetPriority(Priority.Medium); onClose(); }}
              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${task.priority === Priority.Medium ? 'text-orange-500 bg-orange-50' : 'text-orange-500'}`}
              title="中优先级"
            >
              <Flag className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => { onSetPriority(Priority.Low); onClose(); }}
              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${task.priority === Priority.Low ? 'text-blue-500 bg-blue-50' : 'text-blue-500'}`}
              title="低优先级"
            >
              <Flag className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => { onSetPriority(Priority.None); onClose(); }}
              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${task.priority === Priority.None ? 'text-gray-400 bg-gray-50' : 'text-gray-400'}`}
              title="无优先级"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ContextMenuSeparator />

        {/* 操作列表 */}
        <div className="py-1">
          <MenuItem icon={<ListTree className="w-4 h-4" />} label="添加子任务" onClick={() => { onAddSubtask(); onClose(); }} />
          <MenuItem icon={<Link2 className="w-4 h-4" />} label="关联主任务" onClick={() => {}} />
          <MenuItem icon={<ArrowUpToLine className="w-4 h-4" />} label="置顶" onClick={() => {}} />
          <MenuItem icon={<XCircle className="w-4 h-4" />} label="放弃" onClick={() => {}} />
          <MenuItem icon={<FolderInput className="w-4 h-4" />} label="移动到" onClick={() => {}} hasSubmenu />
          <MenuItem icon={<TagIcon className="w-4 h-4" />} label="标签" onClick={() => {}} hasSubmenu />
          <MenuItem icon={<Target className="w-4 h-4" />} label="开始专注" onClick={() => {}} hasSubmenu />
          <ContextMenuSeparator />
          <MenuItem icon={<Copy className="w-4 h-4" />} label="创建副本" onClick={() => {}} />
          <MenuItem icon={<Link className="w-4 h-4" />} label="复制链接" onClick={() => {}} />
          <MenuItem icon={<FileText className="w-4 h-4" />} label="转换为笔记" onClick={() => {}} />
          <ContextMenuSeparator />
          <MenuItem 
            icon={<Trash2 className="w-4 h-4" />} 
            label="删除" 
            onClick={() => { onDelete(); onClose(); }} 
            danger 
          />
        </div>
      </div>
    </ContextMenu>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  hasSubmenu?: boolean;
}

function MenuItem({ icon, label, onClick, danger, hasSubmenu }: MenuItemProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-1.5 text-[13px] hover:bg-gray-100 transition-colors ${
        danger ? 'text-red-500' : 'text-gray-700'
      }`}
    >
      <span className={`${danger ? 'text-red-500' : 'text-gray-500'}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}
