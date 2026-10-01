import { describe, it, expect } from 'vitest';

import { auditLogRetentionUtils } from '@/features/platform-admin/lib/audit-log-retention-utils';

describe('auditLogRetentionUtils.buildOptions', () => {
  it('offers every preset and the forever option when the instance sets no ceiling', () => {
    expect(
      auditLogRetentionUtils.buildOptions({ savedDays: null, ceiling: null }),
    ).toEqual([30, 90, 180, 365, null]);
  });

  it('hides the presets above the ceiling', () => {
    expect(
      auditLogRetentionUtils.buildOptions({ savedDays: null, ceiling: 100 }),
    ).toEqual([30, 90, null]);
  });

  it('keeps a saved value that is not a preset, in order', () => {
    expect(
      auditLogRetentionUtils.buildOptions({ savedDays: 45, ceiling: null }),
    ).toEqual([30, 45, 90, 180, 365, null]);
  });

  it('drops a saved value that a lowered ceiling now exceeds', () => {
    expect(
      auditLogRetentionUtils.buildOptions({ savedDays: 200, ceiling: 100 }),
    ).toEqual([30, 90, null]);
  });

  it('leaves only the instance option when the ceiling is under the minimum', () => {
    expect(
      auditLogRetentionUtils.buildOptions({ savedDays: null, ceiling: 7 }),
    ).toEqual([null]);
  });
});

describe('auditLogRetentionUtils.initialSelection', () => {
  it('selects the saved value when it is inside the ceiling', () => {
    expect(
      auditLogRetentionUtils.initialSelection({ savedDays: 90, ceiling: 365 }),
    ).toBe(90);
  });

  it('selects the instance option when a lowered ceiling overrides the saved value', () => {
    expect(
      auditLogRetentionUtils.initialSelection({ savedDays: 365, ceiling: 90 }),
    ).toBeNull();
  });
});

describe('auditLogRetentionUtils.effectiveDays', () => {
  it.each([
    { days: null, ceiling: null, expected: null },
    { days: null, ceiling: 365, expected: 365 },
    { days: 90, ceiling: null, expected: 90 },
    { days: 90, ceiling: 365, expected: 90 },
    { days: 730, ceiling: 365, expected: 365 },
  ])(
    'resolves $days days under a $ceiling ceiling to $expected',
    ({ days, ceiling, expected }) => {
      expect(auditLogRetentionUtils.effectiveDays({ days, ceiling })).toBe(
        expected,
      );
    },
  );
});

describe('auditLogRetentionUtils.deletesEvents', () => {
  it.each([
    { next: 30, current: null, expected: true },
    { next: 30, current: 90, expected: true },
    { next: 90, current: 30, expected: false },
    { next: 90, current: 90, expected: false },
    { next: null, current: 30, expected: false },
  ])(
    'warns $expected when going from $current to $next days',
    ({ next, current, expected }) => {
      expect(auditLogRetentionUtils.deletesEvents({ next, current })).toBe(
        expected,
      );
    },
  );
});
