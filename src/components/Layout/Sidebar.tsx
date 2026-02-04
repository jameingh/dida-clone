import { useState, useRef, useEffect } from 'react';
import { useLists } from '../../hooks/useLists';
import { useTags, useCreateTag } from '../../hooks/useTags';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Hash, Trash2 } from 'lucide-react';

export default function Sidebar() {
  const { data: lists, isLoading: isListsLoading } = useLists();
  const { data: tags, isLoading: isTagsLoading } = useTags();
  const { selectedListId, setSelectedListId, selectedTagId, setSelectedTagId } = useAppStore();
  const createTag = useCreateTag();

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const newTagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingTag) {
      newTagInputRef.current?.focus();
    }
  }, [isCreatingTag]);

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTag.mutate({
        name: newTagName.trim(),
        color: '#87d068' // 默认绿色，后续可改
      });
      setNewTagName('');
      setIsCreatingTag(false);
    } else {
      setIsCreatingTag(false);
    }
  };

  const isLoading = isListsLoading || isTagsLoading;
  const isInitialLoading = isLoading && !lists && !tags;

  // 只在首次进入应用时显示“加载中”，后续切换保持界面内容不闪烁
  if (isInitialLoading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-sm text-gray-500">加载中...</div>
      </aside>
    );
  }

  const smartLists = lists?.filter((list) => list.is_smart) || [];
  const customLists = lists?.filter((list) => !list.is_smart) || [];

  return (
    <aside className="w-60 bg-[#FAFAFA] border-r border-gray-200 flex flex-col pt-4 overflow-y-auto">
      <div className="flex-1 px-2">
        {/* 智能清单 */}
        <div className="mb-2 space-y-0.5">
          {smartLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors group ${selectedListId === list.id
                ? 'bg-[#E6F7FF] text-[#1890FF]'
                : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg w-5 h-5 flex items-center justify-center">{list.icon}</span>
                <span className={`text-sm ${selectedListId === list.id ? 'font-semibold' : 'font-medium'}`}>
                  {list.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 自定义清单 */}
        <div className="mt-6">
          <div className="px-3 py-2 flex items-center justify-between group cursor-pointer hover:bg-gray-100/50 rounded-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              我的清单
            </div>
            <button
              className="text-gray-400 hover:text-[#1890FF] opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
              title="新建清单"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 mt-0.5">
            {customLists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors ${selectedListId === list.id
                  ? 'bg-[#E6F7FF] text-[#1890FF]'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-5 h-5 flex items-center justify-center">{list.icon}</span>
                  <span className={`text-sm ${selectedListId === list.id ? 'font-semibold' : 'font-medium'}`}>
                    {list.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 标签列表 */}
        <div className="mt-6">
          <div className="px-3 py-2 flex items-center justify-between group cursor-pointer hover:bg-gray-100/50 rounded-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              标签
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingTag(true);
              }}
              className="text-gray-400 hover:text-[#1890FF] opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
              title="新建标签"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 mt-0.5">
            {tags?.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTagId(tag.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors group ${selectedTagId === tag.id
                  ? 'bg-[#E6F7FF] text-[#1890FF]'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Hash className={`w-4 h-4 ${selectedTagId === tag.id ? 'text-[#1890FF]' : 'text-gray-400'}`} />
                  <span className={`text-sm ${selectedTagId === tag.id ? 'font-semibold' : 'font-medium'}`}>{tag.name}</span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#CBD5E0' }} />
              </button>
            ))}

            {/* 新建标签输入框 */}
            {isCreatingTag && (
              <form onSubmit={handleCreateTag} className="px-3 py-1.5">
                <input
                  ref={newTagInputRef}
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onBlur={() => !newTagName && setIsCreatingTag(false)}
                  placeholder="标签名称..."
                  className="w-full px-2 py-1 text-sm bg-white border border-[#1890FF] rounded outline-none"
                />
              </form>
            )}

            {!isCreatingTag && tags?.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400 italic">暂无标签</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
