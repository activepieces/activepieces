/// <reference types="vitest/globals" />

import { addSubtractDateAction } from '../src/lib/actions/add-subtract-date';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('addSubtractDateAction', () => {
  test('adds hours', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 10:00:00',
        inputDateFormat: 'YYYY-MM-DD HH:mm:ss',
        outputFormat: 'YYYY-MM-DD HH:mm:ss',
        expression: '+ 2 hour',
        timeZone: undefined,
        setTime: undefined,
        useCurrentTime: false,
      },
    });
    const result = await addSubtractDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-15 12:00:00' });
  });

  test('subtracts days', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 10:00:00',
        inputDateFormat: 'YYYY-MM-DD HH:mm:ss',
        outputFormat: 'YYYY-MM-DD HH:mm:ss',
        expression: '- 5 day',
        timeZone: undefined,
        setTime: undefined,
        useCurrentTime: false,
      },
    });
    const result = await addSubtractDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-10 10:00:00' });
  });

  test('adds multiple units', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15 10:00:00',
        inputDateFormat: 'YYYY-MM-DD HH:mm:ss',
        outputFormat: 'YYYY-MM-DD HH:mm:ss',
        expression: '+ 1 day + 2 hour + 30 minute',
        timeZone: undefined,
        setTime: undefined,
        useCurrentTime: false,
      },
    });
    const result = await addSubtractDateAction.run(ctx);
    expect(result).toEqual({ result: '2024-06-16 12:30:00' });
  });

  test('adds years', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        inputDate: '2024-06-15',
        inputDateFormat: 'YYYY-MM-DD',
        outputFormat: 'YYYY-MM-DD',
        expression: '+ 1 year',
        timeZone: undefined,
        setTime: undefined,
        useCurrentTime: false,
      },
    });
    const result = await addSubtractDateAction.run(ctx);
    expect(result).toEqual({ result: '2025-06-15' });
  });
});
