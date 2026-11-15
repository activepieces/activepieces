import { describe, expect, it } from 'vitest';

import { dateRangeUtils } from './date-range-property';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOLERANCE_MS = 60 * 1000;

function assertDaysAgo(iso: string | undefined, days: number) {
    expect(iso).toBeDefined();
    const actual = new Date(iso as string).getTime();
    const expected = Date.now() - days * DAY_MS;
    expect(Math.abs(actual - expected)).toBeLessThan(TOLERANCE_MS);
}

describe('dateRangeUtils.resolve', () => {
    it('returns empty bounds for any_time / missing preset / nullish value', () => {
        expect(dateRangeUtils.resolve({ preset: 'any_time' })).toEqual({});
        expect(dateRangeUtils.resolve({})).toEqual({});
        expect(dateRangeUtils.resolve(null)).toEqual({});
        expect(dateRangeUtils.resolve(undefined)).toEqual({});
    });

    it('resolves last_24_hours to ~1 day ago with no upper bound', () => {
        const { after, before } = dateRangeUtils.resolve({ preset: 'last_24_hours' });
        assertDaysAgo(after, 1);
        expect(before).toBeUndefined();
    });

    it('resolves last_7_days to ~7 days ago', () => {
        assertDaysAgo(dateRangeUtils.resolve({ preset: 'last_7_days' }).after, 7);
    });

    it('resolves last_30_days to ~30 days ago', () => {
        assertDaysAgo(dateRangeUtils.resolve({ preset: 'last_30_days' }).after, 30);
    });

    it('resolves last_90_days to ~90 days ago', () => {
        assertDaysAgo(dateRangeUtils.resolve({ preset: 'last_90_days' }).after, 90);
    });

    it('passes through custom after/before when present', () => {
        expect(
            dateRangeUtils.resolve({
                preset: 'custom',
                after: '2024-01-01',
                before: '2024-02-01',
            }),
        ).toEqual({ after: '2024-01-01', before: '2024-02-01' });
    });

    it('omits empty custom bounds', () => {
        expect(
            dateRangeUtils.resolve({ preset: 'custom', after: '', before: '' }),
        ).toEqual({ after: undefined, before: undefined });
    });
});
