/// <reference types="vitest/globals" />

import { readFileAction } from '../src/lib/actions/read-file';
import { createMockActionContext, ApFile } from '@activepieces/pieces-framework';

describe('readFileAction', () => {
  test('reads file as text', async () => {
    const file = new ApFile('test.txt', Buffer.from('Hello, World!'), 'txt');
    const ctx = createMockActionContext({
      propsValue: { file, readOptions: 'text' },
    });
    const result = await readFileAction.run(ctx);
    expect(result).toHaveProperty('text', 'Hello, World!');
  });

  test('reads file as base64', async () => {
    const file = new ApFile('test.txt', Buffer.from('Hello'), 'txt');
    const ctx = createMockActionContext({
      propsValue: { file, readOptions: 'base64' },
    });
    const result = await readFileAction.run(ctx);
    expect(result).toHaveProperty('base64');
    expect(result).toHaveProperty('base64WithMimeType');
  });
});
