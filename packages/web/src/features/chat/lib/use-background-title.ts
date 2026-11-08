import { t } from 'i18next';
import { useEffect } from 'react';

export function useBackgroundTitle({
  needsYou,
  streaming,
}: {
  needsYou: boolean;
  streaming: boolean;
}): void {
  useEffect(() => {
    install();
    waiting = needsYou;
    if (needsYou) {
      show('needs-you');
    } else if (shown === 'needs-you') {
      clear();
    }
  }, [needsYou]);
  useEffect(() => {
    if (streaming) {
      replying = true;
      return;
    }
    if (!replying) return;
    replying = false;
    if (!waiting) show('done');
  }, [streaming]);
  useEffect(
    () => () => {
      if (shown === 'needs-you') {
        waiting = false;
        clear();
      }
    },
    [],
  );
}

function show(signal: Signal): void {
  if (!isBackground()) return;
  const base = shown && document.title === written ? baseTitle : document.title;
  baseTitle = base;
  written =
    signal === 'needs-you'
      ? t('Needs you: {title}', { title: base })
      : t('✓ {title}', { title: base });
  shown = signal;
  document.title = written;
}

function clear(): void {
  if (shown && document.title === written) document.title = baseTitle;
  shown = null;
}

function isBackground(): boolean {
  return document.visibilityState === 'hidden';
}

function install(): void {
  if (installed) return;
  installed = true;
  const onVisible = () => {
    if (!isBackground()) {
      clear();
    } else if (waiting) {
      show('needs-you');
    }
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', () => clear());
}

let installed = false;
let waiting = false;
let replying = false;
let shown: Signal | null = null;
let written = '';
let baseTitle = '';

type Signal = 'needs-you' | 'done';
