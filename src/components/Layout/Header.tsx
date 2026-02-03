import { Search, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4">
      <div className="flex-1 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索任务..."
          className="flex-1 outline-none text-sm"
        />
      </div>
      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Settings className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  );
}
