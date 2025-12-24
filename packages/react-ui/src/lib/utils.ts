import { AxiosError } from 'axios';
import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { extractColors } from 'extract-colors';
import i18next, { t } from 'i18next';
import JSZip from 'jszip';
import { useEffect, useRef, useState, RefObject, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import {
  LocalesEnum,
  Permission,
  FlowTrigger,
  flowStructureUtil,
} from '@activepieces/shared';

import { authenticationSession } from './authentication-session';
import { StepMetadata } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const formatUtils = {
  emailRegex,
  convertEnumToHumanReadable(str: string) {
    const words = str.split(/[_.]/);
    return words
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase(),
      )
      .join(' ');
  },
  convertEnumToReadable(value: string): string {
    return (
      value.charAt(0).toUpperCase() +
      value.slice(1).toLowerCase().replace(/_/g, ' ')
    );
  },
  formatNumber(number: number) {
    return new Intl.NumberFormat(i18next.language).format(number);
  },
  formatDateOnlyOrFail(date: Date, fallback: string) {
    try {
      return this.formatDateOnly(date);
    } catch (error) {
      return fallback;
    }
  },
  formatDateOnly(date: Date) {
    return Intl.DateTimeFormat(i18next.language, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  },
  formatDateWithTime(date: Date, hideCurrentYear: boolean) {
    const now = dayjs();
    const inputDate = dayjs(date);
    const isToday = inputDate.isSame(now, 'day');
    const isYesterday = inputDate.isSame(now.subtract(1, 'day'), 'day');
    const isSameYear = inputDate.isSame(now, 'year');

    const timeFormat = new Intl.DateTimeFormat(i18next.language, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    if (isToday) {
      return `${t('Today')}, ${timeFormat.format(date)}`;
    } else if (isYesterday) {
      return `${t('Yesterday')}, ${timeFormat.format(date)}`;
    }

    if (isSameYear && !hideCurrentYear) {
      return Intl.DateTimeFormat(i18next.language, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    }

    return Intl.DateTimeFormat(i18next.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  },
  formatDate(date: Date) {
    const now = dayjs();
    const inputDate = dayjs(date);
    const isToday = inputDate.isSame(now, 'day');
    const isYesterday = inputDate.isSame(now.subtract(1, 'day'), 'day');
    const isSameYear = inputDate.isSame(now, 'year');

    if (isToday) {
      return t('Today');
    }

    if (isYesterday) {
      return t('Yesterday');
    }

    if (isSameYear) {
      return Intl.DateTimeFormat(i18next.language, {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }

    return Intl.DateTimeFormat(i18next.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  },
  formatToHoursAndMinutes(minutes: number) {
    if (minutes < 60) {
      return `${formatUtils.formatNumber(minutes)} mins`;
    }
    const hours = Math.floor(minutes / 60);
    return `${formatUtils.formatNumber(hours)} hours`;
  },
  formatDateToAgo(date: Date) {
    const now = dayjs();
    const inputDate = dayjs(date);
    const diffInSeconds = now.diff(inputDate, 'second');
    const diffInMinutes = now.diff(inputDate, 'minute');
    const diffInHours = now.diff(inputDate, 'hour');
    const diffInDays = now.diff(inputDate, 'day');

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    return inputDate.format('MMM D, YYYY');
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
  urlIsNotLocalhostOrIp(url: string): boolean {
    const parsed = new URL(url);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    ) {
      return false;
    }
    const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(parsed.hostname)) {
      return false;
    }
    return parsed.protocol === 'https:';
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
  [LocalesEnum.CHINESE_SIMPLIFIED]: '简体中文',
  [LocalesEnum.GERMAN]: 'Deutsch',
  [LocalesEnum.ENGLISH]: 'English',
  [LocalesEnum.SPANISH]: 'Español',
  [LocalesEnum.FRENCH]: 'Français',
  [LocalesEnum.JAPANESE]: '日本語',
  [LocalesEnum.DUTCH]: 'Nederlands',
  [LocalesEnum.PORTUGUESE]: 'Português',
  [LocalesEnum.CHINESE_TRADITIONAL]: '繁體中文',
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
  }, [ref.current]);

  return size;
};

export const isStepFileUrl = (json: unknown): json is string => {
  return (
    Boolean(json) &&
    typeof json === 'string' &&
    (json.includes('/api/v1/step-files/') || json.includes('file://'))
  );
};

export const useTimeAgo = (date: Date) => {
  const [timeAgo, setTimeAgo] = useState(() =>
    formatUtils.formatDateToAgo(date),
  );

  useEffect(() => {
    const updateInterval = () => {
      const now = dayjs();
      const inputDate = dayjs(date);
      const diffInSeconds = now.diff(inputDate, 'second');

      // Update every second if less than a minute
      // Update every minute if less than an hour
      // Update every hour if less than a day
      // Update every day if more than a day
      if (diffInSeconds < 60) return 1000;
      if (diffInSeconds < 3600) return 60000;
      if (diffInSeconds < 86400) return 3600000;
      return 86400000;
    };

    const intervalId = setInterval(() => {
      setTimeAgo(formatUtils.formatDateToAgo(date));
    }, updateInterval());

    return () => clearInterval(intervalId);
  }, [date]);

  return timeAgo;
};

export const determineDefaultRoute = (
  checkAccess: (permission: Permission) => boolean,
) => {
  if (checkAccess(Permission.READ_FLOW)) {
    return authenticationSession.appendProjectRoutePrefix('/flows');
  }
  if (checkAccess(Permission.READ_RUN)) {
    return authenticationSession.appendProjectRoutePrefix('/runs');
  }
  return authenticationSession.appendProjectRoutePrefix('/settings');
};
export const NEW_FLOW_QUERY_PARAM = 'newFlow';
export const NEW_TABLE_QUERY_PARAM = 'newTable';
export const NEW_MCP_QUERY_PARAM = 'newMcp';
export const parentWindow: Window = window.opener ?? window.parent;
export const cleanLeadingSlash = (url: string) => {
  return url.startsWith('/') ? url.slice(1) : url;
};

export const cleanTrailingSlash = (url: string) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};
export const combinePaths = ({
  firstPath,
  secondPath,
}: {
  firstPath: string;
  secondPath: string;
}) => {
  const cleanedFirstPath = cleanTrailingSlash(firstPath);
  const cleanedSecondPath = cleanLeadingSlash(secondPath);
  return `${cleanedFirstPath}/${cleanedSecondPath}`;
};

const getBlobType = (extension: 'json' | 'txt' | 'csv') => {
  switch (extension) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    default:
      return `text/plain`;
  }
};

type downloadFileProps =
  | {
      obj: string;
      fileName: string;
      extension: 'json' | 'txt' | 'csv';
    }
  | {
      obj: JSZip;
      fileName: string;
      extension: 'zip';
    };
export const downloadFile = async ({
  obj,
  fileName,
  extension,
}: downloadFileProps) => {
  const blob =
    extension === 'zip'
      ? await obj.generateAsync({ type: 'blob' })
      : //utf-8 with bom
        new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), obj], {
          type: getBlobType(extension),
        });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const scrollToElementAndClickIt = (elementId: string) => {
  const element = document.getElementById(elementId);
  element?.scrollIntoView({
    behavior: 'instant',
    block: 'start',
  });
  element?.click();
};

export const routesThatRequireProjectId = {
  runs: '/runs',
  singleRun: '/runs/:runId',
  flows: '/flows',
  singleFlow: '/flows/:flowId',
  connections: '/connections',
  singleConnection: '/connections/:connectionId',
  tables: '/tables',
  singleTable: '/tables/:tableId',
  todos: '/todos',
  singleTodo: '/todos/:todoId',
  settings: '/settings',
  releases: '/releases',
  singleRelease: '/releases/:releaseId',
};

const gradientCache = new Map<string, string>();

export const useGradientFromPieces = (trigger: FlowTrigger | undefined) => {
  const [gradient, setGradient] = useState<string>('');

  const steps = useMemo(
    () => (trigger ? flowStructureUtil.getAllSteps(trigger) : []),
    [trigger],
  );
  
  const stepsMetadataResults = stepsHooks.useStepsMetadata(steps);
  
  const stepsMetadata: StepMetadata[] = useMemo(
    () =>
      stepsMetadataResults
        .map((data) => data.data)
        .filter((data) => !!data) as StepMetadata[],
    [JSON.stringify(stepsMetadataResults.map((r) => r.dataUpdatedAt))],
  );

  const uniqueMetadata: StepMetadata[] = useMemo(
    () =>
      stepsMetadata.filter(
        (item, index, self) =>
          self.findIndex(
            (secondItem) => item.displayName === secondItem.displayName,
          ) === index,
      ),
    [stepsMetadata.map((m) => m.displayName).join(',')],
  );

  const cacheKey = useMemo(
    () => uniqueMetadata.map((m) => m.logoUrl).join(','),
    [uniqueMetadata],
  );

  useEffect(() => {
    if (gradientCache.has(cacheKey)) {
      setGradient(gradientCache.get(cacheKey)!);
      return;
    }

    const extractColorsFromPieces = async () => {
      if (uniqueMetadata.length === 0) {
        setGradient('');
        gradientCache.set(cacheKey, '');
        return;
      }

      try {
        const allColors: string[] = [];

        const logosToProcess = uniqueMetadata
          .slice(0, 4)
          .filter((metadata) => metadata.logoUrl);

        for (const metadata of logosToProcess) {
          try {
            const colors = await extractColors(metadata.logoUrl, {
              crossOrigin: 'anonymous',
              pixels: 10000,
              distance: 0.2,
            });

            const topColors = colors
              .sort((a, b) => b.area - a.area)
              .slice(0, 2)
              .map((color) => color.hex);

            allColors.push(...topColors);
          } catch (error) {
            console.error(
              `Failed to extract colors from ${metadata.displayName}:`,
              error,
            );
          }
        }

        let resultGradient = '';
        if (allColors.length > 0) {
          const uniqueColors = Array.from(new Set(allColors)).slice(0, 4);

          if (uniqueColors.length === 1) {
            resultGradient = `linear-gradient(135deg, ${uniqueColors[0]}15, ${uniqueColors[0]}30)`;
          } else {
            const gradientColors = uniqueColors
              .map((color) => `${color}20`)
              .join(', ');
            resultGradient = `linear-gradient(135deg, ${gradientColors})`;
          }
        }

        setGradient(resultGradient);
        gradientCache.set(cacheKey, resultGradient);
      } catch (error) {
        console.error('Failed to extract colors:', error);
        setGradient('');
        gradientCache.set(cacheKey, '');
      }
    };

    extractColorsFromPieces();
  }, [cacheKey, uniqueMetadata]);

  return gradient;
};
