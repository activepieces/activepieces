/// <reference types="vitest/globals" />

import { find } from '../src/lib/actions/find';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('find action', () => {
  test('finds plain text match', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world',
        expression: 'world',
        ignoreCase: false,
      },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('world');
  });

  test('finds regex match', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'abc123def', expression: '\\d+', ignoreCase: false },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('123');
  });

  test('returns null when no match', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'hello world', expression: 'xyz', ignoreCase: false },
    });
    const result = await find.run(ctx);
    expect(result).toBeNull();
  });

  test('captures regex groups', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: '2024-01-15',
        expression: '(\\d{4})-(\\d{2})-(\\d{2})',
        ignoreCase: false,
      },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('2024-01-15');
    expect(result![1]).toBe('2024');
    expect(result![2]).toBe('01');
    expect(result![3]).toBe('15');
  });

  test('returns only the first match when multiple exist', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'cat and cat', expression: 'cat', ignoreCase: false },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toBe('cat');
  });

  test('is case-sensitive by default', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'Cat cat', expression: 'cat', ignoreCase: false },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('cat');
  });

  test('ignores case when ignoreCase is true', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'Cat cat', expression: 'cat', ignoreCase: true },
    });
    const result = await find.run(ctx);
    expect(result).not.toBeNull();
    expect(result![0]).toBe('Cat');
  });
});
