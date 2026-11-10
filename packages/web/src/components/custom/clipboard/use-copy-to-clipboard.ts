import { useCallback, useEffect, useRef, useState } from 'react';

import { clipboardUtils } from './clipboard-utils';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    const copied = await clipboardUtils.copy(text);
    if (!copied || !isMounted.current) {
      return;
    }
    setIsCopied(true);
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }, []);

  return { isCopied, copy };
}

const COPIED_RESET_MS = 3000;
