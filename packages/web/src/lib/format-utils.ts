import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
import i18next, { t } from 'i18next';

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
  formatToHoursAndMinutes(seconds: number) {
    const d = dayjs.duration(Math.round(seconds), 'seconds');
    const h = Math.floor(d.asHours());
    const m = d.minutes();
    const s = d.seconds();

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
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
