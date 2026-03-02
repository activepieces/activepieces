// @vitest-environment jsdom
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

import {
  isStepFileUrl,
  cleanLeadingSlash,
  cleanTrailingSlash,
  combinePaths,
  isMac,
  wait,
} from '../dom-utils';
import { formatUtils } from '../format-utils';
import { cn } from '../utils';
import { validationUtils } from '../validation-utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatUtils.convertEnumToHumanReadable', () => {
  it('converts underscore-separated enum', () => {
    expect(formatUtils.convertEnumToHumanReadable('HELLO_WORLD')).toBe(
      'Hello World',
    );
  });

  it('converts dot-separated enum', () => {
    expect(formatUtils.convertEnumToHumanReadable('HELLO.WORLD')).toBe(
      'Hello World',
    );
  });

  it('handles single word', () => {
    expect(formatUtils.convertEnumToHumanReadable('HELLO')).toBe('Hello');
  });
});

describe('formatUtils.convertEnumToReadable', () => {
  it('converts underscore-separated enum to readable', () => {
    expect(formatUtils.convertEnumToReadable('HELLO_WORLD')).toBe(
      'Hello world',
    );
  });

  it('handles single word', () => {
    expect(formatUtils.convertEnumToReadable('ACTIVE')).toBe('Active');
  });
});

describe('formatUtils.formatDuration', () => {
  it('returns dash for undefined', () => {
    expect(formatUtils.formatDuration(undefined)).toBe('-');
  });

  it('formats milliseconds', () => {
    expect(formatUtils.formatDuration(500)).toBe('500 milliseconds');
  });

  it('formats milliseconds in short mode', () => {
    expect(formatUtils.formatDuration(500, true)).toBe('500 ms');
  });

  it('formats seconds', () => {
    expect(formatUtils.formatDuration(5000)).toBe('5 seconds');
  });

  it('formats seconds in short mode', () => {
    expect(formatUtils.formatDuration(5000, true)).toBe('5 s');
  });

  it('formats minutes and seconds', () => {
    expect(formatUtils.formatDuration(90000)).toBe('1 minutes 30 seconds');
  });

  it('formats minutes and seconds in short mode', () => {
    expect(formatUtils.formatDuration(90000, true)).toBe('1 min 30 s');
  });

  it('formats exact minutes', () => {
    expect(formatUtils.formatDuration(120000)).toBe('2 minutes');
  });
});

describe('formatUtils.formatToHoursAndMinutes', () => {
  it('formats seconds only', () => {
    expect(formatUtils.formatToHoursAndMinutes(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatUtils.formatToHoursAndMinutes(125)).toBe('2m 5s');
  });

  it('formats exact minutes', () => {
    expect(formatUtils.formatToHoursAndMinutes(120)).toBe('2m');
  });

  it('formats hours and minutes', () => {
    expect(formatUtils.formatToHoursAndMinutes(3720)).toBe('1h 2m');
  });

  it('formats exact hours', () => {
    expect(formatUtils.formatToHoursAndMinutes(3600)).toBe('1h');
  });
});

describe('formatUtils.urlIsNotLocalhostOrIp', () => {
  it('returns false for localhost', () => {
    expect(formatUtils.urlIsNotLocalhostOrIp('http://localhost:3000')).toBe(
      false,
    );
  });

  it('returns false for 127.0.0.1', () => {
    expect(formatUtils.urlIsNotLocalhostOrIp('http://127.0.0.1:3000')).toBe(
      false,
    );
  });

  it('returns false for IP address', () => {
    expect(formatUtils.urlIsNotLocalhostOrIp('http://192.168.1.1:3000')).toBe(
      false,
    );
  });

  it('returns true for valid https URL', () => {
    expect(formatUtils.urlIsNotLocalhostOrIp('https://example.com')).toBe(true);
  });

  it('returns false for http URL with valid domain', () => {
    expect(formatUtils.urlIsNotLocalhostOrIp('http://example.com')).toBe(false);
  });
});

describe('formatUtils.formatDateToAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  it('formats seconds ago', () => {
    const date = new Date('2025-06-15T11:59:30Z');
    expect(formatUtils.formatDateToAgo(date)).toBe('30s ago');
  });

  it('formats minutes ago', () => {
    const date = new Date('2025-06-15T11:55:00Z');
    expect(formatUtils.formatDateToAgo(date)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    const date = new Date('2025-06-15T09:00:00Z');
    expect(formatUtils.formatDateToAgo(date)).toBe('3h ago');
  });

  it('formats days ago', () => {
    const date = new Date('2025-06-13T12:00:00Z');
    expect(formatUtils.formatDateToAgo(date)).toBe('2d ago');
  });

  it('formats dates older than 30 days as date string', () => {
    const date = new Date('2025-04-01T12:00:00Z');
    const result = formatUtils.formatDateToAgo(date);
    expect(result).toContain('Apr');
    expect(result).toContain('2025');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('formatUtils.formatDateOnly', () => {
  it('formats a date', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    const result = formatUtils.formatDateOnly(date);
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});

describe('formatUtils.formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  it('returns Today for today', () => {
    const date = new Date('2025-06-15T08:00:00Z');
    expect(formatUtils.formatDate(date)).toBe('Today');
  });

  it('returns Yesterday for yesterday', () => {
    const date = new Date('2025-06-14T08:00:00Z');
    expect(formatUtils.formatDate(date)).toBe('Yesterday');
  });

  it('formats same year date without year', () => {
    const date = new Date('2025-03-10T08:00:00Z');
    const result = formatUtils.formatDate(date);
    expect(result).toContain('Mar');
    expect(result).toContain('10');
    expect(result).not.toContain('2025');
  });

  it('formats different year date with year', () => {
    const date = new Date('2024-03-10T08:00:00Z');
    const result = formatUtils.formatDate(date);
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('formatUtils.formatDateWithTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  it('formats today with time', () => {
    const date = new Date('2025-06-15T08:30:00Z');
    const result = formatUtils.formatDateWithTime(date, false);
    expect(result).toContain('Today');
  });

  it('formats yesterday with time', () => {
    const date = new Date('2025-06-14T08:30:00Z');
    const result = formatUtils.formatDateWithTime(date, false);
    expect(result).toContain('Yesterday');
  });

  it('formats same year date with time', () => {
    const date = new Date('2025-03-10T08:30:00Z');
    const result = formatUtils.formatDateWithTime(date, false);
    expect(result).toContain('Mar');
    expect(result).toContain('10');
  });

  it('formats different year date with year and time', () => {
    const date = new Date('2024-03-10T08:30:00Z');
    const result = formatUtils.formatDateWithTime(date, false);
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('test');
  error.response = {
    status,
    data,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('validationUtils.isValidationError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for AxiosError with 409 and VALIDATION code', () => {
    const error = makeAxiosError(409, { code: 'VALIDATION' });
    expect(validationUtils.isValidationError(error)).toBe(true);
  });

  it('returns false for non-axios error', () => {
    expect(validationUtils.isValidationError(new Error('test'))).toBe(false);
  });

  it('returns false for wrong status code', () => {
    const error = makeAxiosError(400, { code: 'VALIDATION' });
    expect(validationUtils.isValidationError(error)).toBe(false);
  });
});

describe('isStepFileUrl', () => {
  it('returns true for step-files URL', () => {
    expect(isStepFileUrl('http://example.com/api/v1/step-files/abc')).toBe(
      true,
    );
  });

  it('returns true for file:// URL', () => {
    expect(isStepFileUrl('file://some-path')).toBe(true);
  });

  it('returns false for non-matching string', () => {
    expect(isStepFileUrl('http://example.com/other')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isStepFileUrl(null)).toBe(false);
  });

  it('returns false for non-string', () => {
    expect(isStepFileUrl(123)).toBe(false);
  });
});

describe('cleanLeadingSlash', () => {
  it('removes leading slash', () => {
    expect(cleanLeadingSlash('/hello')).toBe('hello');
  });

  it('returns string without leading slash unchanged', () => {
    expect(cleanLeadingSlash('hello')).toBe('hello');
  });
});

describe('cleanTrailingSlash', () => {
  it('removes trailing slash', () => {
    expect(cleanTrailingSlash('hello/')).toBe('hello');
  });

  it('returns string without trailing slash unchanged', () => {
    expect(cleanTrailingSlash('hello')).toBe('hello');
  });
});

describe('combinePaths', () => {
  it('combines two paths', () => {
    expect(combinePaths({ firstPath: '/api', secondPath: 'users' })).toBe(
      '/api/users',
    );
  });

  it('handles extra slashes', () => {
    expect(combinePaths({ firstPath: '/api/', secondPath: '/users' })).toBe(
      '/api/users',
    );
  });
});

describe('isMac', () => {
  it('detects Mac user agent', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      writable: true,
      configurable: true,
    });
    expect(isMac()).toBe(true);
  });

  it('returns false for non-Mac user agent', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      writable: true,
      configurable: true,
    });
    expect(isMac()).toBe(false);
  });
});

describe('wait', () => {
  it('resolves after delay', async () => {
    vi.useFakeTimers();
    const promise = wait(100);
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
