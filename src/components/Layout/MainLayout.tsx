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

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.classList.add('is-resizing');
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('is-resizing');
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
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
          className={`w-[2px] h-full cursor-col-resize transition-colors z-50 hover:bg-[var(--dida-primary)] active:bg-[var(--dida-primary-active)] ${isResizing ? 'bg-[var(--dida-primary)]' : 'bg-transparent hover:delay-150'}`}
          onMouseDown={startResizing}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
