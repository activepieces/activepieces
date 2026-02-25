import { defaultValue } from '../src/lib/actions/default-value';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('defaultValue action', () => {
  test('returns value when not empty', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        value: 'hello',
        defaultString: 'fallback',
      },
    });
    const result = await defaultValue.run(ctx);
    expect(result).toBe('hello');
  });

  test('returns default when value is empty string', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        value: '',
        defaultString: 'fallback',
      },
    });
    const result = await defaultValue.run(ctx);
    expect(result).toBe('fallback');
  });

  test('returns default when value is undefined', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        value: undefined,
        defaultString: 'fallback',
      },
    });
    const result = await defaultValue.run(ctx);
    expect(result).toBe('fallback');
  });

  test('returns default when value is null', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        value: null,
        defaultString: 'fallback',
      },
    });
    const result = await defaultValue.run(ctx);
    expect(result).toBe('fallback');
  });
});
