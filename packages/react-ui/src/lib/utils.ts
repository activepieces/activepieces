import { AxiosError } from 'axios';
import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { useEffect, useRef, useState, RefObject } from 'react';
import { twMerge } from 'tailwind-merge';

import { ActionType, TriggerType, LocalesEnum } from '@activepieces/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMAIL_REGEX =
  '^[a-zA-Z0-9_.+]+(?<!^[0-9]*)@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$';

const cleanResponse = (response: unknown): unknown => {
  if (Number.isNaN(response)) {
    return 'NaN';
  }
  if (response === null) {
    return 'null';
  }
  if (response === undefined) {
    return 'undefined';
  }
  if (response === 0) {
    return '0';
  }
  if (response === false) {
    return 'false';
  }
  return response;
};

export const formatUtils = {
  EMAIL_REGEX,
  formatStepInputAndOutput(
    sampleData: unknown,
    type: ActionType | TriggerType | null,
  ) {
    const cleanedSampleData = cleanResponse(sampleData);
    const shouldRemoveIterations =
      type === ActionType.LOOP_ON_ITEMS &&
      cleanedSampleData &&
      typeof cleanedSampleData === 'object' &&
      'iterations' in cleanedSampleData;
    if (shouldRemoveIterations) {
      return {
        ...cleanedSampleData,
        iterations: undefined,
      };
    }
    return cleanedSampleData;
  },
  convertEnumToHumanReadable(str: string) {
    const words = str.split('_');
    return words
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase(),
      )
      .join(' ');
  },
  formatNumber(number: number) {
    return new Intl.NumberFormat('en-US').format(number);
  },
  formatDate(date: Date) {
    const now = dayjs();
    const inputDate = dayjs(date);

    const isToday = inputDate.isSame(now, 'day');
    const isYesterday = inputDate.isSame(now.subtract(1, 'day'), 'day');

    const timeFormat = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeFormat.format(date)}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeFormat.format(date)}`;
    } else {
      return Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    }
  },
  formatDuration(durationMs: number | undefined, short?: boolean): string {
    if (durationMs === undefined) {
      return '-';
    }
    if (durationMs < 1000) {
      const durationMsFormatted = Math.floor(durationMs);
      return short
        ? `${durationMsFormatted} ms`
        : `${durationMsFormatted} milliseconds`;
    }
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) {
      return short ? `${seconds} s` : `${seconds} seconds`;
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return short
        ? `${minutes} min ${
            remainingSeconds > 0 ? `${remainingSeconds} s` : ''
          }`
        : `${minutes} minutes${
            remainingSeconds > 0 ? ` ${remainingSeconds} seconds` : ''
          }`;
    }

    return short ? `${seconds} s` : `${seconds} seconds`;
  },
};

export const validationUtils = {
  isValidationError: (
    error: unknown,
  ): error is AxiosError<{ code?: string; params?: { message?: string } }> => {
    console.error('isValidationError', error);
    return (
      error instanceof AxiosError &&
      error.response?.status === 409 &&
      error.response?.data?.code === 'VALIDATION'
    );
  },
};

export function useForwardedRef<T>(ref: React.ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}

export const localesMap = {
  [LocalesEnum.BULGARIAN]: 'Български',
  [LocalesEnum.CHINESE_SIMPLIFIED]: '简体中文',
  [LocalesEnum.INDONESIAN]: 'Bahasa Indonesia',
  [LocalesEnum.GERMAN]: 'Deutsch',
  [LocalesEnum.ENGLISH]: 'English',
  [LocalesEnum.SPANISH]: 'Español',
  [LocalesEnum.FRENCH]: 'Français',
  [LocalesEnum.ITALIAN]: 'Italiano',
  [LocalesEnum.JAPANESE]: '日本語',
  [LocalesEnum.HUNGARIAN]: 'Magyar',
  [LocalesEnum.DUTCH]: 'Nederlands',
  [LocalesEnum.PORTUGUESE]: 'Português (Brasil)',
  [LocalesEnum.UKRAINIAN]: 'Українська',
  [LocalesEnum.VIETNAMESE]: 'Tiếng Việt',
};

export const useElementSize = (ref: RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, setSize]);

  return size;
};
