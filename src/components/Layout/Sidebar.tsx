import { useLists } from '../../hooks/useLists';
import { useAppStore } from '../../store/useAppStore';
import { Plus } from 'lucide-react';

export default function Sidebar() {
  const { data: lists, isLoading } = useLists();
  const { selectedListId, setSelectedListId } = useAppStore();

  if (isLoading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-sm text-gray-500">加载中...</div>
      </aside>
    );
  }

  const smartLists = lists?.filter((list) => list.is_smart) || [];
  const customLists = lists?.filter((list) => !list.is_smart) || [];

  return (
    <aside className="w-60 bg-[#F5F5F5] border-r border-gray-200 flex flex-col pt-4">
      <div className="flex-1 overflow-y-auto px-2">
        {/* 智能清单 */}
        <div className="mb-6 space-y-0.5">
          {smartLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors group ${selectedListId === list.id
                  ? 'bg-[#E6F7FF] text-[#1890FF]'
                  : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{list.icon}</span>
                <span className={`text-sm ${selectedListId === list.id ? 'font-semibold' : 'font-medium'}`}>
                  {list.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 自定义清单 */}
        {customLists.length > 0 && (
          <div className="mt-4">
            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              我的清单
            </div>
            <div className="space-y-0.5">
              {customLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors ${selectedListId === list.id
                      ? 'bg-[#E6F7FF] text-[#1890FF]'
                      : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{list.icon}</span>
                    <span className={`text-sm ${selectedListId === list.id ? 'font-semibold' : 'font-medium'}`}>
                      {list.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-transparent">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
          <Plus className="w-4 h-4" />
          <span className="font-medium">新建清单</span>
        </button>
      </div>
    </aside>
  );
}
