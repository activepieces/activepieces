/// <reference types="vitest/globals" />

import { split } from '../src/lib/actions/split';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('split action', () => {
  test('splits text by comma', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'a,b,c',
        delimiter: ',',
      },
    });
    const result = await split.run(ctx);
    expect(result).toStrictEqual(['a', 'b', 'c']);
  });

  test('splits text by space', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello world foo',
        delimiter: ' ',
      },
    });
    const result = await split.run(ctx);
    expect(result).toStrictEqual(['hello', 'world', 'foo']);
  });

  test('returns single-element array when delimiter not found', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello',
        delimiter: ',',
      },
    });
    const result = await split.run(ctx);
    expect(result).toStrictEqual(['hello']);
  });

  test('splits by multi-character delimiter', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'a::b::c',
        delimiter: '::',
      },
    });
    const result = await split.run(ctx);
    expect(result).toStrictEqual(['a', 'b', 'c']);
  });

  test('handles empty segments', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'a,,b',
        delimiter: ',',
      },
    });
    const result = await split.run(ctx);
    expect(result).toStrictEqual(['a', '', 'b']);
  });
});
