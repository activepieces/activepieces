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

describe('convertXmlToJson keepLeadingZeros', () => {
  test('keeps leading zeros as strings when enabled', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><zip>02134</zip><id>00123</id><count>42</count></root>',
        ignoreAttributes: false,
        keepLeadingZeros: true,
      },
    });
    const result = await convertXmlToJson.run(ctx);
    expect(result).toEqual({ root: { zip: '02134', id: '00123', count: 42 } });
  });

  test('keeps leading zeros in nested elements and arrays when enabled', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<customers><customer><account>000987</account><address><zip>02134</zip></address></customer><customer><account>12345</account><address><zip>00501</zip></address></customer></customers>',
        ignoreAttributes: false,
        keepLeadingZeros: true,
      },
    });
    const result = await convertXmlToJson.run(ctx);
    expect(result).toEqual({
      customers: {
        customer: [
          { account: '000987', address: { zip: '02134' } },
          { account: 12345, address: { zip: '00501' } },
        ],
      },
    });
  });

  test('keeps parsing zero, decimals and exponents as numbers when enabled', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><a>0</a><b>0.5</b><c>1e5</c><d>007.5</d></root>',
        ignoreAttributes: false,
        keepLeadingZeros: true,
      },
    });
    const result = await convertXmlToJson.run(ctx);
    expect(result).toEqual({ root: { a: 0, b: 0.5, c: 100000, d: '007.5' } });
  });

  test('strips leading zeros when disabled', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><zip>02134</zip><id>00123</id><count>42</count></root>',
        ignoreAttributes: false,
        keepLeadingZeros: false,
      },
    });
    const result = await convertXmlToJson.run(ctx);
    expect(result).toEqual({ root: { zip: 2134, id: 123, count: 42 } });
  });

  test('keeps the previous numeric output for existing steps without the option', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        xml: '<root><zip>02134</zip><item>007</item><item>8</item></root>',
        ignoreAttributes: false,
      },
    });
    const result = await convertXmlToJson.run(ctx);
    expect(result).toEqual({ root: { zip: 2134, item: [7, 8] } });
  });
});
