import { useEffect, useRef } from 'react';

export type HotkeyName = 'F1' | 'F2' | 'F4' | 'F9' | 'F12';
export type HotkeyMap = Partial<Record<HotkeyName, () => void>>;

/** يلتقط مفاتيح الوظائف على مستوى النافذة ويمنع سلوك المتصفح الافتراضي. */
export function useHotkeys(map: HotkeyMap): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const handler = ref.current[e.key as HotkeyName];
      if (!handler) return;
      e.preventDefault();
      if (!e.repeat) handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
