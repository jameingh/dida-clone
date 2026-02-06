import { ReactNode, useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import NavRail from './NavRail';
import { useShortcuts } from '../../hooks/useShortcuts';

interface MainLayoutProps {
  children: ReactNode;
}

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 240;

export default function MainLayout({ children }: MainLayoutProps) {
  useShortcuts();
  
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

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      // 防止拖动时选择文本
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <NavRail />
      <Sidebar width={sidebarWidth} />
      
      {/* Resizer Divider */}
      <div 
        className={`w-[2px] h-full cursor-col-resize transition-colors z-50 hover:bg-[#1890FF] active:bg-[#1890FF] ${isResizing ? 'bg-[#1890FF]' : 'bg-transparent hover:delay-150'}`}
        onMouseDown={startResizing}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
