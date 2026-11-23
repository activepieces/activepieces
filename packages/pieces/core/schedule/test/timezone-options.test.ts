/// <reference types="vitest/globals" />

import { timezoneOptions } from '../src/lib/common';

function realOffset({ timeZone, isoInstant }: { timeZone: string; isoInstant: string }) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(isoInstant))
    .find((part) => part.type === 'timeZoneName')?.value;
  return name === undefined || name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}

function labelOffsets(label: string) {
  const prefix = /^\(GMT([^)]*)\)/.exec(label);
  return prefix?.[1].match(/[+-]\d\d:\d\d/g) ?? [];
}

function offsetMinutes(offset: string) {
  const [hours, minutes] = offset.slice(1).split(':').map(Number);
  return (offset.startsWith('-') ? -1 : 1) * (hours * 60 + minutes);
}

function wrongLabels(zones?: string[]) {
  return timezoneOptions
    .filter((option) => !zones || zones.includes(option.value))
    .flatMap((option) => {
      const shown = labelOffsets(option.label);
      const jan = realOffset({ timeZone: option.value, isoInstant: '2026-01-15T12:00:00Z' });
      const jul = realOffset({ timeZone: option.value, isoInstant: '2026-07-15T12:00:00Z' });
      const wrong = [jan, jul].filter((actual) => !shown.includes(actual));
      return wrong.length === 0 ? [] : [`${option.label} [${option.value}] Jan=${jan} Jul=${jul}`];
    });
}

describe('schedule timezone options', () => {
  it('offers every zone with an offset prefix', () => {
    expect(timezoneOptions.length).toBeGreaterThan(400);
    expect(timezoneOptions.find((o) => o.value === 'America/Los_Angeles')?.label).toBe(
      '(GMT-08:00/-07:00) America, Los Angeles',
    );
    expect(timezoneOptions.find((o) => o.value === 'Asia/Kolkata')?.label).toBe('(GMT+05:30) Asia, Kolkata');
  });

  it('shows both offsets for common DST zones', () => {
    expect(
      wrongLabels(['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Australia/Sydney']),
    ).toEqual([]);
  });

  it('shows the current offset for zones whose rules changed', () => {
    expect(wrongLabels(['Asia/Almaty', 'America/Asuncion'])).toEqual([]);
  });

  it('shows no offset that is wrong for part of the year', () => {
    expect(wrongLabels()).toEqual([]);
  });

  it('shows the offset of temporary clock changes outside January and July', () => {
    expect(timezoneOptions.find((o) => o.value === 'Africa/Casablanca')?.label).toBe(
      '(GMT+00:00/+01:00) Africa, Casablanca',
    );
  });

  it('is sorted by offset', () => {
    const lowest = timezoneOptions.map((o) => offsetMinutes(labelOffsets(o.label)[0]));
    const outOfOrder = lowest.filter((minutes, i) => i > 0 && minutes < lowest[i - 1]);
    expect(outOfOrder).toEqual([]);
  });
});
