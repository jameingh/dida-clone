import { useEffect, RefObject } from 'react';

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // 如果点击的是任何一个 ref 指向的元素或其子元素，则不触发 handler
      const isOutside = refs.every(ref => {
        return !ref.current || !ref.current.contains(event.target as Node);
      });

      if (isOutside) {
        handler();
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, enabled]);
}
