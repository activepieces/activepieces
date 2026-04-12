import { AP_FUNCTIONS } from '@activepieces/shared';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const TOOLTIP_WIDTH = 320;
const TOOLTIP_GAP = 6;
const SCREEN_MARGIN = 8;
const TOOLTIP_MIN_HEIGHT = 140;

type HoverState = {
  functionName: string;
  errorMessage: string | null;
  anchorTop: number;
  anchorBottom: number;
  anchorLeft: number;
  anchorRight: number;
} | null;

type DisplayState = {
  functionName: string;
  errorMessage: string | null;
  anchorTop: number;
  anchorBottom: number;
  anchorLeft: number;
  anchorRight: number;
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

    const clearHoverHighlights = () => {
      el.querySelectorAll('.ap-fn-active').forEach((n) =>
        n.classList.remove('ap-fn-active'),
      );
    };

    const scheduleHide = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setHoverState(null);
        clearHoverHighlights();
        hideTimer.current = null;
      }, 120);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const startEl = target.closest<HTMLElement>('[data-function-start]');
      const endEl = target.closest<HTMLElement>('[data-function-end]');
      const sepEl = target.closest<HTMLElement>('[data-function-sep]');

      if (!startEl && !endEl && !sepEl) {
        scheduleHide();
        return;
      }

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      clearHoverHighlights();

      const openId = startEl
        ? startEl.getAttribute('data-function-start')
        : endEl
        ? endEl.getAttribute('data-function-end')
        : sepEl!.getAttribute('data-function-sep');

      if (!openId) return;

      const matchStart = el.querySelector<HTMLElement>(
        `[data-function-start="${openId}"]`,
      );
      const matchEnd = el.querySelector<HTMLElement>(
        `[data-function-end="${openId}"]`,
      );
      matchStart?.classList.add('ap-fn-active');
      matchEnd?.classList.add('ap-fn-active');
      el.querySelectorAll<HTMLElement>(
        `[data-function-sep="${openId}"]`,
      ).forEach((sep) => sep.classList.add('ap-fn-active'));

      const name =
        startEl?.getAttribute('data-function-name') ??
        matchStart?.getAttribute('data-function-name') ??
        '';

      const anchorBadge = startEl ?? sepEl ?? endEl!;
      const rect = anchorBadge.getBoundingClientRect();

      const errorMessage =
        startEl?.getAttribute('data-fn-error-msg') ??
        matchStart?.getAttribute('data-fn-error-msg') ??
        null;

      setHoverState({
        functionName: name,
        errorMessage,
        anchorTop: rect.top,
        anchorBottom: rect.bottom,
        anchorLeft: rect.left,
        anchorRight: rect.right,
      });
    };

    // mouseleave fires only when the pointer fully exits the element (not between children)
    const onMouseLeave = () => scheduleHide();

    el.addEventListener('mouseover', onMouseOver);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mouseover', onMouseOver);
      el.removeEventListener('mouseleave', onMouseLeave);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [editorRef]);

  let displayState: DisplayState | null = null;
  if (hoverState) {
    const cursorArgIndex =
      activeFn?.functionName === hoverState.functionName
        ? activeFn.argIndex
        : null;
    displayState = { ...hoverState, currentArgIndex: cursorArgIndex };
  } else if (activeFn?.anchorRect) {
    displayState = {
      functionName: activeFn.functionName,
      errorMessage: activeFn.errorMessage,
      anchorTop: activeFn.anchorRect.top,
      anchorBottom: activeFn.anchorRect.bottom,
      anchorLeft: activeFn.anchorRect.left,
      anchorRight: activeFn.anchorRect.right,
      currentArgIndex: activeFn.argIndex,
    };
  }

  const fnDef = displayState
    ? AP_FUNCTIONS.find((f) => f.name === displayState!.functionName)
    : null;

  const lastRenderRef = useRef<
    { display: DisplayState; fnDef: typeof fnDef } | undefined
  >(undefined);
  if (displayState && fnDef) {
    lastRenderRef.current = { display: displayState, fnDef };
  }

  // Don't render anything until we've had at least one hover/cursor event
  if (!lastRenderRef.current) return null;

  const renderData = lastRenderRef.current;
  const visible = displayState !== null && fnDef !== null;

  return (
    <FunctionTooltipCard
      visible={visible}
      fnDef={renderData.fnDef!}
      errorMessage={renderData.display.errorMessage}
      anchorTop={renderData.display.anchorTop}
      anchorBottom={renderData.display.anchorBottom}
      anchorLeft={renderData.display.anchorLeft}
      anchorRight={renderData.display.anchorRight}
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
  );
}

type FnDef = (typeof AP_FUNCTIONS)[number];

type FunctionTooltipCardProps = {
  fnDef: FnDef;
  errorMessage: string | null;
  anchorTop: number;
  anchorBottom: number;
  anchorLeft: number;
  anchorRight?: number;
  currentArgIndex?: number | null;
  visible?: boolean;
  centered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function FunctionTooltipCard({
  fnDef,
  errorMessage: _errorMessage,
  anchorTop,
  anchorBottom,
  anchorLeft,
  anchorRight,
  currentArgIndex,
  visible = true,
  centered = false,
  onMouseEnter,
  onMouseLeave,
}: FunctionTooltipCardProps) {
  const { t } = useTranslation();
  const argNames = parseSyntaxArgs(fnDef.syntax);

  const showAbove = !centered && anchorTop > TOOLTIP_MIN_HEIGHT + SCREEN_MARGIN;
  const top = centered
    ? (anchorTop + anchorBottom) / 2
    : showAbove
    ? anchorTop - TOOLTIP_GAP
    : anchorBottom + TOOLTIP_GAP;

  const badgeCenterX =
    anchorRight != null ? (anchorLeft + anchorRight) / 2 : anchorLeft;
  const idealLeft = badgeCenterX - TOOLTIP_WIDTH / 2;
  const left = Math.min(
    Math.max(idealLeft, SCREEN_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - SCREEN_MARGIN,
  );

  return createPortal(
    <div
      data-fn-tooltip
      className={cn(
        'fixed z-[9999] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 space-y-2 transition-opacity duration-150',
        visible
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none',
      )}
      style={{
        top,
        left,
        width: TOOLTIP_WIDTH,
        transform: centered ? 'translateY(-50%)' : showAbove ? 'translateY(-100%)' : undefined,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p className="text-[12px] text-gray-100 leading-snug">
        {t(fnDef.description)}
      </p>
      {argNames.length > 0 && currentArgIndex != null && (
        <div className="flex flex-wrap gap-x-0.5 gap-y-0.5 text-[12px] font-mono bg-gray-800 rounded px-2 py-1">
          <span className="text-purple-400">{fnDef.name}(</span>
          {argNames.map((arg, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-500">; </span>}
              <span
                className={cn(
                  i === currentArgIndex
                    ? 'text-amber-400 font-semibold'
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
          Example
        </p>
        <code className="block bg-gray-800 rounded px-2 py-1.5 text-[11px] font-mono text-gray-100 break-all leading-relaxed">
          {t(fnDef.example)}
        </code>
        <code className="flex items-center gap-1.5 bg-gray-800 rounded px-2 py-1.5 text-[11px] font-mono break-all leading-relaxed">
          <span className="text-gray-500 shrink-0">↳</span>
          <span className="text-green-400">{t(fnDef.exampleResult)}</span>
        </code>
      </div>
    </div>,
    document.body,
  );
}

function parseSyntaxArgs(syntax: string): string[] {
  const match = syntax.match(/\((.+)\)/);
  if (!match || !match[1].trim()) return [];
  return match[1].split(';').map((s) => s.trim());
}

export type ActiveFunctionInfo = {
  functionName: string;
  openId: string;
  argIndex: number;
  errorMessage: string | null;
  anchorRect: DOMRect | null;
};
