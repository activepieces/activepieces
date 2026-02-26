/// <reference types="vitest/globals" />

import { convertJsonToXml } from '../src/lib/actions/convert-json-to-xml';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('convertJsonToXml', () => {
  test('converts simple object to XML', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        json: { name: 'Alice', age: 30 },
        attributes_key: undefined,
        header: undefined,
      },
    });
    const result = await convertJsonToXml.run(ctx);
    expect(result).toContain('<name>Alice</name>');
    expect(result).toContain('<age>30</age>');
  });

  test('converts nested object to XML', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        json: { person: { name: 'Alice', address: { city: 'LA' } } },
        attributes_key: undefined,
        header: undefined,
      },
    });
    const result = await convertJsonToXml.run(ctx);
    expect(result).toContain('<person>');
    expect(result).toContain('<name>Alice</name>');
    expect(result).toContain('<city>LA</city>');
  });

  test('adds XML header when header is true', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        json: { name: 'Alice' },
        attributes_key: undefined,
        header: true,
      },
    });
    const result = await convertJsonToXml.run(ctx);
    expect(result).toContain('<?xml');
  });

  test('no XML header when header is false', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        json: { name: 'Alice' },
        attributes_key: undefined,
        header: false,
      },
    });
    const result = await convertJsonToXml.run(ctx);
    expect(result).not.toContain('<?xml');
  });

  test('uses custom attributes_key', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        json: { person: { customAttr: { id: '1' }, name: 'Alice' } },
        attributes_key: 'customAttr',
        header: false,
      },
    });
    const result = await convertJsonToXml.run(ctx);
    expect(result).toContain('id=');
  });
});
