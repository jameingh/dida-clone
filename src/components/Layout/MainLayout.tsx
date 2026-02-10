import { ReactNode, useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import NavRail from './NavRail';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useAppStore } from '../../store/useAppStore';

interface MainLayoutProps {
  children: ReactNode;
}

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 240;

export default function MainLayout({ children }: MainLayoutProps) {
  useShortcuts();
  const { isSidebarCollapsed } = useAppStore();
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      // NavRail 宽度为 60px
      const newWidth = e.clientX - 60;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
        localStorage.setItem('sidebarWidth', newWidth.toString());
      }
    }
  }, [isResizing]);

  // 处理 Tauri 模式下的鼠标事件丢失问题
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => resize(e);
      const handleMouseUp = () => stopResizing();

      // 在 window 上监听，确保即使鼠标移动到 iframe 或其他层级也能捕捉到
      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
      document.body.classList.add('is-resizing');
      
      // 禁用文本选择
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      return () => {
        window.removeEventListener('mousemove', handleMouseMove, { capture: true });
        window.removeEventListener('mouseup', handleMouseUp, { capture: true });
        document.body.classList.remove('is-resizing');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, resize, stopResizing]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <NavRail />
      
      <div 
        className={`flex transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'w-0' : ''}`}
        style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
      >
        <Sidebar width={sidebarWidth} />
        
        {/* Resizer Divider */}
        <div 
          className={`w-[6px] -ml-[3px] h-full cursor-col-resize transition-colors z-[100] relative group`}
          onMouseDown={startResizing}
        >
          <div className={`absolute inset-y-0 left-[2px] w-[2px] transition-colors ${isResizing ? 'bg-[var(--dida-primary)]' : 'bg-transparent group-hover:bg-[var(--dida-primary)] group-hover:delay-75'}`} />
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
