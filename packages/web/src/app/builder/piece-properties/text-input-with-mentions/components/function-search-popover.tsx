import { AP_FUNCTIONS, ApFunction } from '@activepieces/core-formula';
import { ExternalLink } from 'lucide-react';
import { RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { FunctionTooltipCard } from './function-hover-popover';

const SCREEN_MARGIN = 8;

const CATEGORY_COLORS: Record<string, string> = {
  text: 'bg-swatch-11-surface text-swatch-11-ink border-swatch-11-line',
  number: 'bg-swatch-8-surface text-swatch-8-ink border-swatch-8-line',
  date: 'bg-swatch-5-surface text-swatch-5-ink border-swatch-5-line',
  list: 'bg-swatch-3-surface text-swatch-3-ink border-swatch-3-line',
  logic: 'bg-swatch-6-surface text-swatch-6-ink border-swatch-6-line',
};

type FunctionSearchPopoverProps = {
  query: string;
  position: { top: number; left: number };
  editorRef: RefObject<HTMLDivElement | null>;
  onSelect: (fn: ApFunction) => void;
  onClose: () => void;
  docsUrl?: string;
};

export function FunctionSearchPopover({
  query,
  position,
  editorRef,
  onSelect,
  onClose,
  docsUrl,
}: FunctionSearchPopoverProps) {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredFn, setHoveredFn] = useState<ApFunction | null>(null);
  const [hoverItemRect, setHoverItemRect] = useState<DOMRect | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? AP_FUNCTIONS.filter((fn) =>
        fn.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof globalThis.Node)) {
        return;
      }
      if (popoverRef.current?.contains(target)) {
        return;
      }
      if (editorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [editorRef, onClose]);

  const editorRect = editorRef.current?.getBoundingClientRect();
  const popoverTop = editorRect ? editorRect.bottom + 4 : position.top;
  const popoverLeft = editorRect
    ? Math.min(
        Math.max(editorRect.left + window.scrollX, SCREEN_MARGIN),
        window.innerWidth - editorRect.width - SCREEN_MARGIN,
      )
    : position.left;
  const popoverWidth = editorRect ? editorRect.width : 360;

  const tooltipOnRight = popoverLeft < 340;

  const grouped = filtered.reduce<Record<string, ApFunction[]>>((acc, fn) => {
    if (!acc[fn.category]) acc[fn.category] = [];
    acc[fn.category].push(fn);
    return acc;
  }, {});

  let globalIdx = 0;

  const footer = (
    <div className="border-t border-gray-6 px-3 py-2 text-sm text-gray-11 flex items-center justify-between">
      <div className="flex items-center gap-1">
        {t('Press')}
        <kbd className="bg-gray-3 border border-gray-6 rounded-md px-1 flex justify-center text-sm">
          ↵
        </kbd>
        {t('to apply')}
      </div>
      {docsUrl && (
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'link', size: 'xs' }))}
          onMouseDown={(e) => e.preventDefault()}
        >
          {t('See All')}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );

  if (!query) {
    return createPortal(
      <div
        ref={popoverRef}
        className="fixed z-9998 bg-panel border border-gray-6 rounded-lg shadow-lg overflow-hidden"
        style={{ top: popoverTop, left: popoverLeft, width: popoverWidth }}
      >
        <div className="px-3 py-8 text-sm text-gray-11 text-center">
          {t('Type to search functions...')}
        </div>
        {footer}
      </div>,
      document.body,
    );
  }

  if (filtered.length === 0) {
    return createPortal(
      <div
        ref={popoverRef}
        className="fixed z-9998 bg-panel border border-gray-6 rounded-lg shadow-lg overflow-hidden"
        style={{ top: popoverTop, left: popoverLeft, width: popoverWidth }}
      >
        <div className="px-3 py-8 text-sm text-gray-11 text-center">
          {t('No functions found')}
        </div>
        {footer}
      </div>,
      document.body,
    );
  }

  return createPortal(
    <>
      <div
        ref={popoverRef}
        className="fixed z-999 bg-panel border border-gray-6 rounded-lg shadow-lg overflow-hidden"
        style={{ top: popoverTop, left: popoverLeft, width: popoverWidth }}
      >
        <div
          ref={listRef}
          className="max-h-64 overflow-y-auto pb-1"
          role="listbox"
        >
          {Object.entries(grouped).map(([category, fns]) => (
            <div key={category}>
              <div className="px-3 py-1 text-sm font-semibold text-gray-11 sticky top-0 bg-panel">
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
                      isActive ? 'bg-gray-4' : 'hover:bg-gray-4',
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
                        'text-sm font-mono font-medium px-1.5 py-0.5 rounded-md border shrink-0',
                        CATEGORY_COLORS[fn.category] ??
                          'bg-gray-3 text-gray-11',
                      )}
                    >
                      {fn.name}
                    </span>
                    <span className="text-gray-11 text-sm truncate">
                      {t(fn.description)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {footer}
      </div>

      {/* Tooltip shown to the left (or right if near left edge) of hovered item */}
      {hoveredFn && hoverItemRect && (
        <FunctionTooltipCard
          fnDef={hoveredFn}
          errorMessage={null}
          centered={true}
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

export const DEFAULT_FORMULAS_DOCS_URL =
  'https://www.activepieces.com/docs/flows/using-formulas';
