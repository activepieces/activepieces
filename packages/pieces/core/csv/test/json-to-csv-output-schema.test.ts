/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { jsonToCsvAction } from '../src/lib/actions/convert-json-to-csv';

describe('convert_json_to_csv output schema', () => {
  test('declares a schema', () => {
    expect(jsonToCsvAction.outputSchema).toBeDefined();
  });

  test('the described path resolves to the whole CSV string', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '',
        json_array: [{ name: 'Alice', age: 30 }],
        delimiter_type: ',',
      },
    });
    const output = await jsonToCsvAction.run(ctx);
    const field = jsonToCsvAction.outputSchema?.fields[0];

    expect(field?.value).toBe('');
    expect(typeof output).toBe('string');
    expect(output).toContain('name,age');
    expect(output).toContain('Alice,30');
  });
});
