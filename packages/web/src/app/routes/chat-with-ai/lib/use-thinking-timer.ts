import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { formatUtils } from '@/lib/format-utils';

export function useThinkingTimer(isActive: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    setSeconds(0);
    const interval = setInterval(() => {
      if (startRef.current) {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return seconds;
}

export function formatThinkingTime({
  seconds,
  isActive,
}: {
  seconds: number;
  isActive: boolean;
}): string {
  if (seconds < 1) {
    return isActive ? t('Thinking...') : t('Thought for a few seconds');
  }
  const duration = formatUtils.formatToHoursAndMinutes(seconds);
  return isActive
    ? t('Thinking for {duration}...', { duration })
    : t('Thought for {duration}', { duration });
}
