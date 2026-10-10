import { describe, it, expect } from 'vitest';
import { figranium } from '../src';
import { scheduleUtils } from '../src/lib/common/schedule-props';

describe('figranium piece', () => {
  it('should be defined with correct displayName', () => {
    expect(figranium).toBeDefined();
    expect(figranium.displayName).toBe('Figranium');
  });

  it('buildScheduleBody correctly builds cron schedule body', () => {
    const result = scheduleUtils.buildScheduleBody({
      scheduleMode: 'cron',
      scheduleConfig: { cronExpression: '0 9 * * 1' },
    });
    expect(result).toEqual({ cron: '0 9 * * 1' });
  });

  it('buildScheduleBody correctly builds interval schedule body', () => {
    const result = scheduleUtils.buildScheduleBody({
      scheduleMode: 'frequency',
      scheduleConfig: { frequency: 'interval', intervalMinutes: 30 },
    });
    expect(result).toEqual({ frequency: 'interval', intervalMinutes: 30 });
  });
});
