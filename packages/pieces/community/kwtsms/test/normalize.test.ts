// 2026-11-16 +03: unit tests for phone and message cleaning (kwtSMS API docs, section "Phone number edge cases").
import { describe, expect, it } from 'vitest';
import {
  chunkPhones,
  cleanMessage,
  normalizePhone,
  normalizePhones,
} from '../src/lib/common/normalize';

describe('normalizePhone', () => {
  it.each([
    ['+96500000001', '96500000001'],
    ['0096500000001', '96500000001'],
    ['965 0000 0001', '96500000001'],
    ['965-0000-0001', '96500000001'],
    ['(965) 0000.0001', '96500000001'],
    ['٩٦٥٠٠٠٠٠٠٠١', '96500000001'],
    ['۹۶۵۰۰۰۰۰۰۰۱', '96500000001'],
    ['abc', ''],
    ['', ''],
  ])('%s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });
});

describe('normalizePhones', () => {
  it('splits, normalizes and dedupes', () => {
    expect(
      normalizePhones(['+96500000001, 0096500000001', '96500000002\n96500000003']),
    ).toEqual(['96500000001', '96500000002', '96500000003']);
  });
  it('accepts a single string and null', () => {
    expect(normalizePhones('+96500000001')).toEqual(['96500000001']);
    expect(normalizePhones(undefined)).toEqual([]);
  });
});

describe('chunkPhones', () => {
  it('splits at 200 numbers', () => {
    const phones = Array.from({ length: 450 }, (_, i) => `9651${String(i).padStart(7, '0')}`);
    const batches = chunkPhones(phones);
    expect(batches.map((b) => b.length)).toEqual([200, 200, 50]);
  });
  it('keeps the joined list under 2500 characters', () => {
    const phones = Array.from({ length: 199 }, (_, i) => `97150${String(i).padStart(8, '0')}`);
    for (const b of chunkPhones(phones)) expect(b.join(',').length).toBeLessThanOrEqual(2500);
  });
});

describe('cleanMessage', () => {
  it('strips emoji, keeps Arabic and newlines', () => {
    expect(cleanMessage('Hello \u{1F600} مرحبا\nline2 \u{1F44D}\u{1F3FD}')).toBe(
      'Hello  مرحبا\nline2',
    );
  });
  it('strips hidden characters and HTML', () => {
    expect(cleanMessage('﻿Hi​ <b>there</b>‏')).toBe('Hi there');
  });
  it('normalizes CRLF and returns empty for emoji only', () => {
    expect(cleanMessage('a\r\nb')).toBe('a\nb');
    expect(cleanMessage('\u{1F600}')).toBe('');
  });
});
