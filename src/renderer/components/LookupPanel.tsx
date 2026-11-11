import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

interface Props<T> {
  readonly title: string;
  readonly placeholder: string;
  readonly search: (query: string) => Promise<T[]>;
  readonly itemKey: (item: T) => string | number;
  readonly renderItem: (item: T) => ReactNode;
  readonly onPick: (item: T) => void;
  readonly onClose: () => void;
  readonly hint?: string;
}

const DEBOUNCE_MS = 120;

/** نافذة بحث عامة (أصناف/عملاء): أسهم + Enter + Esc، وتركيز تلقائي. */
export function LookupPanel<T>({ title, placeholder, search, itemKey, renderItem, onPick, onClose, hint }: Props<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      search(query.trim())
        .then((r) => {
          if (cancelled) return;
          setResults(r);
          setIndex(0);
        })
        .catch(() => !cancelled && setResults([]));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, search]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[index]) {
      onPick(results[index]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-olive/50 pt-20" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl rounded-xl bg-cream p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-2xl font-bold text-olive">{title}</h2>
        {hint && <p className="mb-3 rounded-md bg-gold/20 px-3 py-2 text-olive">{hint}</p>}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border-2 border-olive/30 bg-white px-4 py-3 text-xl outline-none focus:border-gold"
        />
        <ul className="mt-3 max-h-96 overflow-auto" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-olive/60">لا توجد نتائج</li>}
          {results.map((item, i) => (
            <li
              key={itemKey(item)}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => onPick(item)}
              className={`cursor-pointer rounded-lg px-3 py-3 text-xl ${i === index ? 'bg-gold/25' : ''}`}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
