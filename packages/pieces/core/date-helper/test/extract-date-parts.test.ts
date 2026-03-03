/// <reference types="vitest/globals" />

import { extractDateParts } from '../src/lib/actions/extract-date-parts';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('extractDateParts', () => {
  test('extracts multiple parts', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 12:30:45',
        inputFormat: 'YYYY-MM-DD HH:mm:ss',
        unitExtract: ['year', 'month', 'day', 'hour', 'minute', 'second'],
      },
    });
    const result = await extractDateParts.run(ctx);
    expect(result).toMatchObject({
      year: 2024,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 45,
    });
  });

  test('extracts day of week', async () => {
    // June 15, 2024 is a Saturday
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15',
        inputFormat: 'YYYY-MM-DD',
        unitExtract: ['dayOfWeek'],
      },
    });
    const result = await extractDateParts.run(ctx);
    expect(result).toHaveProperty('dayOfWeek', 'Saturday');
  });

  test('extracts month name', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15',
        inputFormat: 'YYYY-MM-DD',
        unitExtract: ['monthName'],
      },
    });
    const result = await extractDateParts.run(ctx);
    expect(result).toHaveProperty('monthName', 'June');
  });
});
