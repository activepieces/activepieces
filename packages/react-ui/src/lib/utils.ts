import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

import { ActionType, TriggerType } from '@activepieces/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMAIL_REGEX =
  '^[a-zA-Z0-9_.+]+(?<!^[0-9]*)@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$';

export const formatUtils = {
  EMAIL_REGEX,
  formatStepInputAndOutput(
    sampleData: unknown,
    type: ActionType | TriggerType | null,
  ) {
    if (sampleData === undefined) {
      return 'undefined';
    }
    const shouldRemoveIterations =
      type === ActionType.LOOP_ON_ITEMS &&
      sampleData &&
      typeof sampleData === 'object' &&
      'iterations' in sampleData;
    if (shouldRemoveIterations) {
      return {
        ...sampleData,
        iterations: undefined,
      };
    }
    return sampleData;
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
