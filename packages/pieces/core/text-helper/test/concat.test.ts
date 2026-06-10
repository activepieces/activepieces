/// <reference types="vitest/globals" />

import { concat } from '../src/lib/actions/concat';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('concat action', () => {
  test('concatenates texts without separator', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: ['hello', 'world'],
        separator: undefined,
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('helloworld');
  });

  test('concatenates texts with separator', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: ['hello', 'world'],
        separator: ' ',
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('hello world');
  });

  test('concatenates with comma separator', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: ['a', 'b', 'c'],
        separator: ', ',
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('a, b, c');
  });

  test('handles empty array', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: [],
        separator: ',',
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('');
  });

  test('handles single text', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: ['only'],
        separator: ',',
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('only');
  });

  test('handles null texts as empty array', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        texts: undefined,
        separator: undefined,
      },
    });
    const result = await concat.run(ctx);
    expect(result).toBe('');
  });
});
