/// <reference types="vitest/globals" />

import { createMockPollingTriggerContext } from '@activepieces/pieces-framework';
import { everyXMinutesTrigger } from '../src/lib/triggers/every-x-minutes.trigger';

describe('everyXMinutesTrigger', () => {
  test('schedules a rolling 59-minute interval instead of a */59 cron', async () => {
    const schedules: unknown[] = [];
    const ctx = createMockPollingTriggerContext({
      propsValue: { minutes: 59 },
      onSetSchedule: (schedule) => schedules.push(schedule),
    });

    await everyXMinutesTrigger.onEnable(ctx);

    expect(schedules).toEqual([{ intervalMs: 59 * 60_000 }]);
  });

  test('schedules divisor values as intervals too', async () => {
    const schedules: unknown[] = [];
    const ctx = createMockPollingTriggerContext({
      propsValue: { minutes: 5 },
      onSetSchedule: (schedule) => schedules.push(schedule),
    });

    await everyXMinutesTrigger.onEnable(ctx);

    expect(schedules).toEqual([{ intervalMs: 5 * 60_000 }]);
  });
});
