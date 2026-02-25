import { find } from '../src/lib/actions/find';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('find action', () => {
  test('finds plain text match', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world',
        expression: 'world',
      },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('world');
  });

  test('finds regex match', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'abc123def',
        expression: '\\d+',
      },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('123');
  });

  test('returns null when no match', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world',
        expression: 'xyz',
      },
    });
    const result = await find.run(ctx);
    expect(result).toBeNull();
  });

  test('captures regex groups', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: '2024-01-15',
        expression: '(\\d{4})-(\\d{2})-(\\d{2})',
      },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('2024-01-15');
    expect(result![1]).toBe('2024');
    expect(result![2]).toBe('01');
    expect(result![3]).toBe('15');
  });
});
