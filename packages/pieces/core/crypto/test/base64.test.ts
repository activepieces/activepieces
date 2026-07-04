/// <reference types="vitest/globals" />

import { base64Encode } from '../src/lib/actions/base64-encode';
import { base64Decode } from '../src/lib/actions/base64-decode';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('base64Encode', () => {
  test('encodes text to base64', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'hello' },
    });
    const result = await base64Encode.run(ctx);
    expect(result).toBe('aGVsbG8=');
  });

});

describe('base64Decode', () => {
  test('decodes base64 to text', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'aGVsbG8=' },
    });
    const result = await base64Decode.run(ctx);
    expect(result).toBe('hello');
  });

  test('roundtrip encode then decode', async () => {
    const original = 'The quick brown fox jumps over the lazy dog';
    const encodeCtx = createMockActionContext({
      propsValue: { text: original },
    });
    const encoded = await base64Encode.run(encodeCtx);

    const decodeCtx = createMockActionContext({
      propsValue: { text: encoded as string },
    });
    const decoded = await base64Decode.run(decodeCtx);
    expect(decoded).toBe(original);
  });
});
