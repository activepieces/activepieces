import { AP_FUNCTIONS } from '@activepieces/shared';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

type HoverState = {
  functionName: string;
  errorMessage: string | null;
  top: number;
  left: number;
} | null;

type DisplayState = {
  functionName: string;
  errorMessage: string | null;
  top: number;
  left: number;
  currentArgIndex: number | null;
};

type FunctionEditorTooltipProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  activeFn: ActiveFunctionInfo | null;
};

export function FunctionEditorTooltip({
  editorRef,
  activeFn,
}: FunctionEditorTooltipProps) {
  const [hoverState, setHoverState] = useState<HoverState>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const clearHighlights = () => {
      el.querySelectorAll('.ap-fn-active').forEach((n) =>
        n.classList.remove('ap-fn-active'),
      );
    };

    const show = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const startEl = target.closest<HTMLElement>('[data-function-start]');
      const endEl = target.closest<HTMLElement>('[data-function-end]');

      if (!startEl && !endEl) return;

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      clearHighlights();

      const openId = startEl
        ? startEl.getAttribute('data-function-start')
        : endEl!.getAttribute('data-function-end');

      if (!openId) return;

      const matchStart = el.querySelector(`[data-function-start="${openId}"]`);
      const matchEnd = el.querySelector(`[data-function-end="${openId}"]`);
      matchStart?.classList.add('ap-fn-active');
      matchEnd?.classList.add('ap-fn-active');

      const name =
        startEl?.getAttribute('data-function-name') ??
        matchStart?.getAttribute('data-function-name') ??
        '';

      const badge = (startEl ?? endEl)!;
      const rect = badge.getBoundingClientRect();

      const errorMessage =
        startEl?.getAttribute('data-fn-error-msg') ??
        matchStart?.getAttribute('data-fn-error-msg') ??
        null;

      setHoverState({
        functionName: name,
        errorMessage,
        top: rect.top,
        left: rect.left,
      });
    };

    const hide = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest('[data-fn-tooltip]')) return;
      hideTimer.current = setTimeout(() => {
        setHoverState(null);
        clearHighlights();
      }, 100);
    };

    el.addEventListener('mouseover', show);
    el.addEventListener('mouseout', hide);
    return () => {
      el.removeEventListener('mouseover', show);
      el.removeEventListener('mouseout', hide);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [editorRef]);

  // Merge hover and cursor states into a single display state
  let displayState: DisplayState | null = null;
  if (hoverState) {
    // When hovering, also show arg index if cursor is inside the same function
    const cursorArgIndex =
      activeFn?.functionName === hoverState.functionName
        ? activeFn.argIndex
        : null;
    displayState = { ...hoverState, currentArgIndex: cursorArgIndex };
  } else if (activeFn?.anchorRect) {
    displayState = {
      functionName: activeFn.functionName,
      errorMessage: activeFn.errorMessage,
      top: activeFn.anchorRect.top,
      left: activeFn.anchorRect.left,
      currentArgIndex: activeFn.argIndex,
    };
  }

  const fnDef = displayState
    ? AP_FUNCTIONS.find((f) => f.name === displayState!.functionName)
    : null;

  // Keep last known state so the fade-out animation has content to show
  const lastDisplayRef = useRef<
    | {
        display: DisplayState;
        fnDef: typeof fnDef;
      }
    | undefined
  >(undefined);
  if (displayState && fnDef) {
    lastDisplayRef.current = { display: displayState, fnDef };
  }
  const renderData =
    displayState && fnDef
      ? { display: displayState, fnDef }
      : lastDisplayRef.current ?? null;

  const visible = displayState !== null && fnDef !== null;

  return (
    <div
      className={cn(
        'transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {renderData && (
        <FunctionTooltipCard
          fnDef={renderData.fnDef!}
          errorMessage={renderData.display.errorMessage}
          top={renderData.display.top}
          left={renderData.display.left}
          currentArgIndex={renderData.display.currentArgIndex}
          onMouseEnter={() => {
            if (hideTimer.current) {
              clearTimeout(hideTimer.current);
              hideTimer.current = null;
            }
          }}
          onMouseLeave={() => {
            setHoverState(null);
            editorRef.current
              ?.querySelectorAll('.ap-fn-active')
              .forEach((n) => n.classList.remove('ap-fn-active'));
          }}
        />
      )}
    </div>
  );
}

type FnDef = (typeof AP_FUNCTIONS)[number];

type FunctionTooltipCardProps = {
  fnDef: FnDef;
  errorMessage: string | null;
  top: number;
  left: number;
  currentArgIndex?: number | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function FunctionTooltipCard({
  fnDef,
  errorMessage,
  top,
  left,
  currentArgIndex,
  onMouseEnter,
  onMouseLeave,
}: FunctionTooltipCardProps) {
  const { t } = useTranslation();
  const argNames = parseSyntaxArgs(fnDef.syntax);

  return (
    <div
      data-fn-tooltip
      className="fixed z-50 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 space-y-2 pointer-events-auto"
      style={{ top, left, transform: 'translateY(-100%) translateY(-6px)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {errorMessage && (
        <div className="flex items-start gap-1.5 text-[12px] text-red-400 leading-snug pb-1 border-b border-gray-700">
          <span className="shrink-0">⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}
      <p className="text-[12px] text-gray-100 leading-snug">
        {t(fnDef.description)}
      </p>
      {argNames.length > 0 && currentArgIndex !== null && (
        <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-[11px] font-mono">
          <span className="text-purple-400">{fnDef.name}(</span>
          {argNames.map((arg, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-500">,</span>}
              <span
                className={cn(
                  i === currentArgIndex
                    ? 'text-red-400 font-semibold'
                    : 'text-gray-400',
                )}
              >
                {arg}
              </span>
            </React.Fragment>
          ))}
          <span className="text-purple-400">)</span>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {t('Example')}
        </p>
        <code className="block bg-gray-800 rounded px-2 py-1 text-[11px] font-mono text-gray-100 break-all">
          {t(fnDef.example)}
        </code>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-gray-400">↳</span>
          <span className="font-mono text-gray-200">
            {t(fnDef.exampleResult)}
          </span>
        </div>
      </div>
    </div>
  );
}

function parseSyntaxArgs(syntax: string): string[] {
  const match = syntax.match(/\((.+)\)/);
  if (!match || !match[1].trim()) return [];
  return match[1].split(',').map((s) => s.trim());
}

export type ActiveFunctionInfo = {
  functionName: string;
  argIndex: number;
  errorMessage: string | null;
  anchorRect: DOMRect | null;
};
