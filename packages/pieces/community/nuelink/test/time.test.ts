import { describe, expect, it } from 'vitest';
import { nuelinkTime } from '../src/lib/common/time';

const NOW = Date.parse('2026-01-01T00:00:00Z');

describe('brand-local schedule conversion', () => {
  it.each([
    ['2026-07-01T08:00:00Z', 'Europe/London', '2026-07-01 09:00:00'],
    ['2026-12-01T09:00:00Z', 'Europe/London', '2026-12-01 09:00:00'],
    ['2026-03-29T00:30:00Z', 'Europe/London', '2026-03-29 00:30:00'],
    ['2026-03-29T01:30:00Z', 'Europe/London', '2026-03-29 02:30:00'],
    ['2026-07-01T13:00:00Z', 'America/New_York', '2026-07-01 09:00:00'],
    ['2026-12-01T14:00:00Z', 'America/New_York', '2026-12-01 09:00:00'],
    ['2026-03-08T07:30:00Z', 'America/New_York', '2026-03-08 03:30:00'],
    ['2026-07-01T09:00:00+02:00', 'Africa/Casablanca', '2026-07-01 08:00:00'],
    ['2026-10-12T09:00:00+03:00', 'Asia/Amman', '2026-10-12 09:00:00'],
    ['2026-10-12T06:00:00Z', 'Asia/Amman', '2026-10-12 09:00:00'],
    ['2026-10-12T23:30:00Z', 'Asia/Tokyo', '2026-10-13 08:30:00'],
  ])('%s in %s becomes %s', (value, timeZone, expected) => {
    expect(nuelinkTime.toBrandSchedule({ value, timeZone, now: NOW, label: 'Scheduled Time' }).local).toBe(expected);
  });

  it('refuses the repeated hour when daylight saving ends', () => {
    expect(() => nuelinkTime.toBrandSchedule({ value: '2026-11-01T05:30:00Z', timeZone: 'America/New_York', now: NOW, label: 'Scheduled Time' })).toThrow('repeats');
    expect(() => nuelinkTime.toBrandSchedule({ value: '2026-11-01T06:30:00Z', timeZone: 'America/New_York', now: NOW, label: 'Scheduled Time' })).toThrow('repeats');
    expect(nuelinkTime.toBrandSchedule({ value: '2026-11-01T07:30:00Z', timeZone: 'America/New_York', now: NOW, label: 'Scheduled Time' }).local).toBe('2026-11-01 02:30:00');
  });

  it('requires at least 10 minutes of lead time', () => {
    expect(() => nuelinkTime.toBrandSchedule({ value: '2026-01-01T00:09:59Z', timeZone: 'UTC', now: NOW, label: 'Scheduled Time' })).toThrow('at least 10 minutes');
    expect(nuelinkTime.toBrandSchedule({ value: '2026-01-01T00:10:00Z', timeZone: 'UTC', now: NOW, label: 'Scheduled Time' }).local).toBe('2026-01-01 00:10:00');
  });

  it.each(['2026-10-12 09:00:00', '2026-10-12T09:00', '2026-10-12', '2026-10-12T09:00:00.000'])('rejects a scheduled time without an offset: %s', (value) => {
    expect(() => nuelinkTime.toBrandSchedule({ value, timeZone: 'Asia/Amman', now: NOW, label: 'Scheduled Time' })).toThrow('Send an ISO-8601 time with an offset');
  });

  it('rejects unparseable values', () => {
    expect(() => nuelinkTime.parseInstant({ value: 'tomorrow 9am', label: 'Scheduled Time' })).toThrow('not a valid date and time');
    expect(() => nuelinkTime.parseInstant({ value: '', label: 'Scheduled Time' })).toThrow('is empty');
  });

  it('throws when the brand has no or an unknown timezone', () => {
    expect(() => nuelinkTime.assertTimeZone({ timeZone: null, brandTitle: 'Acme' })).toThrow('has no timezone set');
    expect(() => nuelinkTime.assertTimeZone({ timeZone: '0c7f6a8e-uuid', brandTitle: 'Acme' })).toThrow('does not recognise');
    expect(nuelinkTime.assertTimeZone({ timeZone: ' Europe/London ', brandTitle: 'Acme' })).toBe('Europe/London');
  });

  it('formats filters in UTC, not brand time', () => {
    expect(nuelinkTime.toUtcFilter({ value: '2026-10-01T02:00:00+02:00', label: 'From' })).toBe('2026-10-01 00:00:00');
    expect(nuelinkTime.toUtcFilter({ value: '2026-10-01', label: 'From' })).toBe('2026-10-01 00:00:00');
  });
});
