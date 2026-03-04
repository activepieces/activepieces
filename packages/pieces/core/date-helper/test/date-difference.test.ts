/// <reference types="vitest/globals" />

import { dateDifferenceAction } from '../src/lib/actions/date-difference';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('dateDifferenceAction', () => {
  test('calculates difference in days', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        startDate: '2024-01-01',
        startDateFormat: 'YYYY-MM-DD',
        endDate: '2024-01-10',
        endDateFormat: 'YYYY-MM-DD',
        unitDifference: ['day'],
      },
    });
    const result = await dateDifferenceAction.run(ctx);
    expect(result).toHaveProperty('day', 9);
  });

  test('calculates difference in multiple units', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        startDate: '2024-01-01 00:00:00',
        startDateFormat: 'YYYY-MM-DD HH:mm:ss',
        endDate: '2024-01-01 02:30:45',
        endDateFormat: 'YYYY-MM-DD HH:mm:ss',
        unitDifference: ['hour', 'minute', 'second'],
      },
    });
    const result = await dateDifferenceAction.run(ctx);
    expect(result).toMatchObject({
      hour: 2,
      minute: 30,
      second: 45,
    });
  });

  test('calculates year and month difference', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        startDate: '2022-03-15',
        startDateFormat: 'YYYY-MM-DD',
        endDate: '2024-06-15',
        endDateFormat: 'YYYY-MM-DD',
        unitDifference: ['year', 'month'],
      },
    });
    const result = await dateDifferenceAction.run(ctx);
    expect(result).toHaveProperty('year', 2);
    expect(result).toHaveProperty('month', 3);
  });
});
