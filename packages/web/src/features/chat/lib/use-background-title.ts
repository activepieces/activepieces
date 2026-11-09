import { t } from 'i18next';
import { useEffect, useRef } from 'react';

export function useBackgroundTitle({
  streaming,
  needsYou,
}: {
  streaming: boolean;
  needsYou: boolean;
}): void {
  const wasStreaming = useRef(streaming);
  const needsYouRef = useRef(needsYou);
  needsYouRef.current = needsYou;

  useEffect(() => {
    const finished = wasStreaming.current && !streaming;
    wasStreaming.current = streaming;
    if (!finished || document.visibilityState !== 'hidden') return;
    const base = document.title;
    const marked = needsYouRef.current
      ? t('Needs you: {title}', { title: base })
      : t('✓ {title}', { title: base });
    document.title = marked;
    const restore = () => {
      if (document.title === marked) document.title = base;
      document.removeEventListener('visibilitychange', onVisible);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') restore();
    };
    document.addEventListener('visibilitychange', onVisible);
    return restore;
  }, [streaming]);
}
