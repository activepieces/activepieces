/// <reference types="vitest/globals" />

import { convertXmlToJson } from '../src/lib/actions/convert-xml-to-json';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('convertXmlToJson', () => {
  test('converts simple XML to JSON', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><name>Alice</name><age>30</age></root>',
        ignoreAttributes: false,
      },
    });
    const result = await convertXmlToJson.run(ctx) as Record<string, unknown>;
    expect(result).toMatchObject({ root: { name: 'Alice', age: 30 } });
  });

  test('converts nested XML to JSON', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<person><name>Alice</name><address><city>LA</city></address></person>',
        ignoreAttributes: false,
      },
    });
    const result = await convertXmlToJson.run(ctx) as Record<string, unknown>;
    expect(result).toMatchObject({ person: { name: 'Alice', address: { city: 'LA' } } });
  });

  test('parses attributes when ignoreAttributes is false', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<item id="42"><label>Test</label></item>',
        ignoreAttributes: false,
      },
    });
    const result = await convertXmlToJson.run(ctx) as Record<string, unknown>;
    const item = result['item'] as Record<string, unknown>;
    expect(item['@_id']).toBe('42');
  });

  test('ignores attributes when ignoreAttributes is true', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<item id="42"><label>Test</label></item>',
        ignoreAttributes: true,
      },
    });
    const result = await convertXmlToJson.run(ctx) as Record<string, unknown>;
    const item = result['item'] as Record<string, unknown>;
    expect(item['@_id']).toBeUndefined();
    expect(item['label']).toBe('Test');
  });

  test('converts XML list to array', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><item>1</item><item>2</item><item>3</item></root>',
        ignoreAttributes: false,
      },
    });
    const result = await convertXmlToJson.run(ctx) as Record<string, unknown>;
    const root = result['root'] as Record<string, unknown>;
    expect(Array.isArray(root['item'])).toBe(true);
    expect(root['item']).toEqual([1, 2, 3]);
  });
});
