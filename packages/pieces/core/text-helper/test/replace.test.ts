import { replace } from '../src/lib/actions/replace';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('replace action', () => {
  test('replaces all occurrences by default', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world hello',
        searchValue: 'hello',
        replaceValue: 'hi',
        replaceOnlyFirst: false,
      },
    });
    const result = await replace.run(ctx);
    expect(result).toBe('hi world hi');
  });

  test('replaces only first occurrence when replaceOnlyFirst is true', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world hello',
        searchValue: 'hello',
        replaceValue: 'hi',
        replaceOnlyFirst: true,
      },
    });
    const result = await replace.run(ctx);
    expect(result).toBe('hi world hello');
  });

  test('supports regex patterns', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'abc123def456',
        searchValue: '\\d+',
        replaceValue: '#',
        replaceOnlyFirst: false,
      },
    });
    const result = await replace.run(ctx);
    expect(result).toBe('abc#def#');
  });

  test('deletes matches when replaceValue is empty', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world',
        searchValue: ' world',
        replaceValue: undefined,
        replaceOnlyFirst: false,
      },
    });
    const result = await replace.run(ctx);
    expect(result).toBe('hello');
  });

  test('handles regex with groups', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: '2024-01-15',
        searchValue: '(\\d{4})-(\\d{2})-(\\d{2})',
        replaceValue: '$2/$3/$1',
        replaceOnlyFirst: false,
      },
    });
    const result = await replace.run(ctx);
    expect(result).toBe('01/15/2024');
  });
});
