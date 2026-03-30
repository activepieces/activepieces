import { AP_FUNCTIONS } from '@activepieces/shared';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type TooltipState = {
  visible: boolean;
  functionName: string;
  errorMessage: string | null;
  top: number;
  left: number;
};

type FunctionEditorTooltipProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
};

export function FunctionEditorTooltip({
  editorRef,
}: FunctionEditorTooltipProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    functionName: '',
    errorMessage: null,
    top: 0,
    left: 0,
  });
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

      setTooltip({
        visible: true,
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
        setTooltip((t) => ({ ...t, visible: false }));
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

  if (!tooltip.visible) return null;

  const fnDef = AP_FUNCTIONS.find((f) => f.name === tooltip.functionName);
  if (!fnDef) return null;

  return (
    <FunctionTooltipCard
      fnDef={fnDef}
      errorMessage={tooltip.errorMessage}
      top={tooltip.top}
      left={tooltip.left}
      onMouseEnter={() => {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
      }}
      onMouseLeave={() => {
        setTooltip((t) => ({ ...t, visible: false }));
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
  top: number;
  left: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function FunctionTooltipCard({
  fnDef,
  errorMessage,
  top,
  left,
  onMouseEnter,
  onMouseLeave,
}: FunctionTooltipCardProps) {
  const { t } = useTranslation();
  return (
    <div
      data-fn-tooltip
      className="fixed z-50 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 space-y-2 pointer-events-auto"
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
