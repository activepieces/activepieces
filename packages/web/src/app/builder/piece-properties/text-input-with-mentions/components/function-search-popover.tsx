import { AP_FUNCTIONS, ApFunction } from '@activepieces/shared';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { FunctionTooltipCard } from './function-hover-popover';

const LIST_WIDTH = 360;
const SCREEN_MARGIN = 8;

const CATEGORY_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700 border-blue-200',
  number: 'bg-green-100 text-green-700 border-green-200',
  date: 'bg-orange-100 text-orange-700 border-orange-200',
  list: 'bg-pink-100 text-pink-700 border-pink-200',
  logic: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

type FunctionSearchPopoverProps = {
  query: string;
  position: { top: number; left: number };
  onSelect: (fn: ApFunction) => void;
  onClose: () => void;
};

export function FunctionSearchPopover({
  query,
  position,
  onSelect,
  onClose,
}: FunctionSearchPopoverProps) {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredFn, setHoveredFn] = useState<ApFunction | null>(null);
  const [hoverItemRect, setHoverItemRect] = useState<DOMRect | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = AP_FUNCTIONS.filter(
    (fn) => !query || fn.name.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[activeIdx]) onSelect(filtered[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [filtered, activeIdx, onSelect, onClose]);

  // Clamp left so the popover never goes off the right edge of the screen
  const clampedLeft = Math.min(
    Math.max(position.left, SCREEN_MARGIN),
    window.innerWidth - LIST_WIDTH - SCREEN_MARGIN,
  );

  if (filtered.length === 0) {
    return createPortal(
      <div
        className="fixed z-[9998] bg-popover border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground"
        style={{ top: position.top, left: clampedLeft, width: LIST_WIDTH }}
      >
        {t('No functions found')}
      </div>,
      document.body,
    );
  }

  const grouped = filtered.reduce<Record<string, ApFunction[]>>((acc, fn) => {
    if (!acc[fn.category]) acc[fn.category] = [];
    acc[fn.category].push(fn);
    return acc;
  }, {});

  let globalIdx = 0;

  // Show tooltip to the left of the list; flip right if near left edge
  const tooltipOnRight = clampedLeft < 340;

  return createPortal(
    <>
      <div
        className="fixed z-[9998] bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        style={{ top: position.top, left: clampedLeft, width: LIST_WIDTH }}
      >
        <div
          ref={listRef}
          className="max-h-64 overflow-y-auto py-1"
          role="listbox"
        >
          {Object.entries(grouped).map(([category, fns]) => (
            <div key={category}>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-popover">
                {category}
              </div>
              {fns.map((fn) => {
                const idx = globalIdx++;
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={fn.name}
                    data-idx={idx}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer',
                      isActive ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                    onMouseEnter={(e) => {
                      setActiveIdx(idx);
                      setHoveredFn(fn);
                      setHoverItemRect(
                        (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect(),
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredFn(null);
                      setHoverItemRect(null);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(fn);
                    }}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0',
                        CATEGORY_COLORS[fn.category] ??
                          'bg-muted text-muted-foreground',
                      )}
                    >
                      {fn.name}
                    </span>
                    <span className="text-muted-foreground text-[11px] truncate">
                      {t(fn.description)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
          <kbd className="bg-muted border border-border rounded px-1 text-[10px]">
            ↵
          </kbd>
          {t('to apply')}
        </div>
      </div>

      {/* Tooltip shown to the left (or right if near left edge) of hovered item */}
      {hoveredFn && hoverItemRect && (
        <FunctionTooltipCard
          fnDef={hoveredFn}
          errorMessage={null}
          anchorTop={hoverItemRect.top}
          anchorBottom={hoverItemRect.bottom}
          anchorLeft={
            tooltipOnRight
              ? hoverItemRect.right + 8
              : hoverItemRect.left - 320 - 8
          }
        />
      )}
    </>,
    document.body,
  );
}
