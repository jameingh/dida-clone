import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NavRail from './NavRail';
import { useShortcuts } from '../../hooks/useShortcuts';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  useShortcuts();
  return (
    <div className="flex h-screen bg-white">
      <NavRail />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
