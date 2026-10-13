/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { parseUrl } from '../src/lib/actions/parse-url';

const run = (url: string, returnArrays = true) =>
  parseUrl.run(createMockActionContext({ propsValue: { url, returnArrays } }));

describe('parse_url output schema', () => {
  test('declares a schema', () => {
    expect(parseUrl.outputSchema).toBeDefined();
  });

  test('every described path resolves, and nothing is left undescribed', async () => {
    const output = (await run(
      'https://example.com/a/b?tag=x&tag=y#frag'
    )) as Record<string, unknown>;
    const described = (parseUrl.outputSchema?.fields ?? []).map(
      (f) => f.value ?? f.key
    );

    for (const path of described) {
      expect(output[path], `"${path}" does not resolve`).toBeDefined();
    }
    for (const key of Object.keys(output)) {
      expect(described.includes(key), `"${key}" is not described`).toBe(true);
    }
  });

  test('hash is still present when the URL has no fragment', async () => {
    const output = (await run('https://example.com/a')) as Record<
      string,
      unknown
    >;
    // Present but empty, so the field is accurate rather than a dead path.
    expect(output).toHaveProperty('hash');
    expect(output['hash']).toBe('');
  });

  test('base_url is an absolute URL, matching its url format', async () => {
    const output = (await run('https://example.com/a?x=1')) as Record<
      string,
      unknown
    >;
    expect(output['base_url']).toBe('https://example.com');
    expect(() => new URL(output['base_url'] as string)).not.toThrow();
  });

  test('query_parameters keys are data, justifying dynamicKey', async () => {
    const output = (await run('https://example.com?a=1&b=2')) as Record<
      string,
      unknown
    >;
    expect(Object.keys(output['query_parameters'] as object)).toEqual(['a', 'b']);

    const field = parseUrl.outputSchema?.fields.find(
      (f) => f.key === 'query_parameters'
    );
    expect(field?.dynamicKey).toBe(true);
    expect(field?.children).toBeUndefined();
    expect(field?.listItems).toBeUndefined();
  });
});
