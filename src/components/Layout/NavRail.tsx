import { useAppStore } from '../../store/useAppStore';
import { CheckSquare, Calendar, Search, Settings } from 'lucide-react';

export default function NavRail() {
    const { viewMode, setViewMode } = useAppStore();

    return (
        <div className="w-[60px] h-full bg-[var(--dida-border-light)] border-r border-gray-200 flex flex-col items-center py-4 text-gray-500 z-50 flex-shrink-0">
            {/* 用户头像 */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mb-6 cursor-pointer hover:opacity-90 transition-opacity shadow-sm">
                AK
            </div>

            {/* 核心导航 */}
            <div className="flex flex-col gap-4 w-full items-center px-2">
                <button
                    onClick={() => setViewMode('tasks')}
                    className={`nav-item w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'tasks' ? 'bg-white text-[var(--dida-primary)] shadow-sm' : 'hover:bg-gray-200/50 text-gray-500'
                        }`}
                    title="任务"
                >
                    <CheckSquare className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setViewMode('calendar')}
                    className={`nav-item w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white text-[var(--dida-primary)] shadow-sm' : 'hover:bg-gray-200/50 text-gray-500'
                        }`}
                    title="日历"
                >
                    <Calendar className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setViewMode('search')}
                    className={`nav-item w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'search' ? 'bg-white text-[var(--dida-primary)] shadow-sm' : 'hover:bg-gray-200/50 text-gray-500'
                        }`}
                    title="搜索"
                >
                    <Search className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1" />

            {/* 底部功能 */}
            <div className="flex flex-col gap-4 mb-2">
                <button
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    title="设置"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
