/// <reference types="vitest/globals" />

import { ExecutionType } from '@activepieces/pieces-framework';
import { delayForAction } from '../src/lib/actions/delay-for-action';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function context(propsValue: Record<string, unknown>) {
  return { propsValue, executionType: ExecutionType.BEGIN } as never;
}

describe('delayFor unit conversion', () => {
  it.each([
    ['seconds', 5, 5 * SECOND],
    ['minutes', 2, 2 * MINUTE],
    ['hours', 3, 3 * HOUR],
    ['days', 1, DAY],
  ])('converts %s to milliseconds', async (unit, delayFor, expected) => {
    await expect(
      delayForAction.test(context({ delayFor, unit })),
    ).resolves.toEqual({ delayForInMs: expected, success: true });
  });

  it.each([[undefined], [null]])(
    'falls back to seconds when unit is %s',
    async (unit) => {
      await expect(
        delayForAction.test(context({ delayFor: 3, unit })),
      ).resolves.toEqual({ delayForInMs: 3 * SECOND, success: true });
    },
  );

  it('falls back to seconds when unit is absent', async () => {
    await expect(
      delayForAction.test(context({ delayFor: 3 })),
    ).resolves.toEqual({ delayForInMs: 3 * SECOND, success: true });
  });
});

describe('delayFor rejects a unit outside the enum', () => {
  const unsupported = ['Minute', 'minute', 'weeks', 'MINUTES', ''];

  it.each(unsupported)('rejects %j in test mode', async (unit) => {
    await expect(
      delayForAction.test(context({ delayFor: 1, unit })),
    ).rejects.toThrow();
  });

  it.each(unsupported)('rejects %j in run mode', async (unit) => {
    await expect(
      delayForAction.run(context({ delayFor: 1, unit })),
    ).rejects.toThrow();
  });

  it('does not report success for an unsupported unit', async () => {
    const result = await delayForAction
      .test(context({ delayFor: 10, unit: 'Minute' }))
      .catch(() => undefined);
    expect(result).toBeUndefined();
  });
});

describe('delayFor amount validation', () => {
  it.each([[-1], [-0.5]])('rejects a negative amount of %s', async (delayFor) => {
    await expect(
      delayForAction.test(context({ delayFor, unit: 'seconds' })),
    ).rejects.toThrow();
  });

  it('accepts zero', async () => {
    await expect(
      delayForAction.test(context({ delayFor: 0, unit: 'seconds' })),
    ).resolves.toEqual({ delayForInMs: 0, success: true });
  });
});
