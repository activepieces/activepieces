import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export function PolicyPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-8 lg:px-10">
      {children}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-6 bg-panel',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 rounded-lg bg-gray-3 p-1.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-panel text-gray-12 shadow-xs'
              : 'text-gray-11 hover:text-gray-12',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                'tabular-nums',
                value === o.value ? 'text-gray-11' : 'text-gray-9',
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg border border-gray-7 bg-panel px-3 focus-within:border-accent-8',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-gray-9" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-12 outline-none placeholder:text-gray-11"
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => onChange('')}
          className="rounded text-gray-9 hover:text-gray-12"
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-12">{children}</h3>;
}
