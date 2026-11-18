import { describe, expect, it } from 'vitest';
import { dateInput } from '../src/lib/common/date-input';

describe('dateInput.isoWeekMonday', () => {
    it('returns the Monday of an ISO week', () => {
        expect(dateInput.isoWeekMonday({ weekNumber: 10, year: 2024 })).toBe('04.03.2024');
        expect(dateInput.isoWeekMonday({ weekNumber: 1, year: 2024 })).toBe('01.01.2024');
        expect(dateInput.isoWeekMonday({ weekNumber: 1, year: 2021 })).toBe('04.01.2021');
    });

    it('handles week 53 only in years that have it', () => {
        expect(dateInput.isoWeekMonday({ weekNumber: 53, year: 2020 })).toBe('28.12.2020');
        expect(() => dateInput.isoWeekMonday({ weekNumber: 53, year: 2021 })).toThrow(/1 to 52/);
    });

    it('rejects non-whole or out-of-range week numbers', () => {
        expect(() => dateInput.isoWeekMonday({ weekNumber: 0, year: 2024 })).toThrow(/does not exist/);
        expect(() => dateInput.isoWeekMonday({ weekNumber: 2.5, year: 2024 })).toThrow(/does not exist/);
    });
});

describe('dateInput.toIsoDate', () => {
    it('parses common formats and separators', () => {
        expect(dateInput.toIsoDate({ date: '13.01.2024', format: 'DD.MM.YYYY' })).toBe('2024-01-13');
        expect(dateInput.toIsoDate({ date: '01/13/2024', format: 'MM/DD/YYYY' })).toBe('2024-01-13');
        expect(dateInput.toIsoDate({ date: '2024-1-3', format: 'YYYY-M-D' })).toBe('2024-01-03');
        expect(dateInput.toIsoDate({ date: '13.01.24', format: 'DD.MM.YY' })).toBe('2024-01-13');
    });

    it('rejects a date that does not match the format', () => {
        expect(() => dateInput.toIsoDate({ date: '2024-01-13', format: 'DD.MM.YYYY' })).toThrow(/does not match/);
    });

    it('rejects impossible dates and incomplete formats', () => {
        expect(() => dateInput.toIsoDate({ date: '31.02.2024', format: 'DD.MM.YYYY' })).toThrow(/not a real calendar date/);
        expect(() => dateInput.toIsoDate({ date: '01.2024', format: 'MM.YYYY' })).toThrow(/must include/);
    });

    it('rejects a format that repeats the year, month or day before matching', () => {
        expect(() => dateInput.toIsoDate({ date: '01.01.2024', format: 'DD.D.YYYY' })).toThrow(/more than once/);
        expect(() => dateInput.toIsoDate({ date: '2024.1.24', format: 'YYYY.M.YY' })).toThrow(/more than once/);
    });

    it('answers quickly for an adversarial format and date', () => {
        const format = `${'MD'.repeat(20)}YYYY`;
        const date = `${'1'.repeat(80)}x`;
        const startedAt = Date.now();
        expect(() => dateInput.toIsoDate({ date, format })).toThrow(/more than once/);
        expect(Date.now() - startedAt).toBeLessThan(100);
    });
});
