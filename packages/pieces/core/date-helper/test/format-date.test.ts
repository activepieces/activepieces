/// <reference types="vitest/globals" />

import { formatDateAction } from '../src/lib/actions/format-date';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('formatDateAction', () => {
  test('converts between formats', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 12:30:45',
        inputFormat: 'YYYY-MM-DD HH:mm:ss',
        inputTimeZone: 'UTC',
        outputFormat: 'YYYY-MM-DDTHH:mm:ss',
        outputTimeZone: 'UTC',
      },
    });
    const result = await formatDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-15T12:30:45' });
  });

  test('converts between timezones', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 12:00:00',
        inputFormat: 'YYYY-MM-DD HH:mm:ss',
        inputTimeZone: 'UTC',
        outputFormat: 'YYYY-MM-DD HH:mm:ss',
        outputTimeZone: 'America/New_York',
      },
    });
    const result = await formatDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-15 08:00:00' });
  });

  test('converts to date-only format', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15T12:30:45',
        inputFormat: 'YYYY-MM-DDTHH:mm:ss',
        inputTimeZone: 'UTC',
        outputFormat: 'YYYY-MM-DD',
        outputTimeZone: 'UTC',
      },
    });
    const result = await formatDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-15' });
  });
});
