import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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

  const copy = useCallback((text: string) => {
    writeToClipboard(text)
      .then(() => {
        if (!isMounted.current) {
          return;
        }
        setIsCopied(true);
        if (resetTimer.current) {
          clearTimeout(resetTimer.current);
        }
        resetTimer.current = setTimeout(
          () => setIsCopied(false),
          COPIED_RESET_MS,
        );
      })
      .catch(() => {
        toast.error(t('Failed to copy to clipboard'), { duration: 3000 });
      });
  }, []);

  return { isCopied, copy };
}

async function writeToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

const COPIED_RESET_MS = 3000;
