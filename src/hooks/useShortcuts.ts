import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useShortcuts() {
    const { setSelectedTaskId } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 检查当前是否有输入框处于焦点
            const isInputActive =
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                (document.activeElement as HTMLElement)?.isContentEditable;

            if (isInputActive) {
                // 在输入框中按下 Escape 键失焦
                if (e.key === 'Escape') {
                    (document.activeElement as HTMLElement).blur();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    // 发送自定义事件，由 TaskList 监听并聚焦输入框
                    window.dispatchEvent(new CustomEvent('focus-task-input'));
                    break;
                case 'e':
                    e.preventDefault();
                    // 切换详情面板显示 (逻辑简化为关闭，若需切换可扩展 store 状态)
                    setSelectedTaskId(null);
                    break;
                case 'escape':
                    // 全局 Esc 关闭详情
                    setSelectedTaskId(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSelectedTaskId]);
}
