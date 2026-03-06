/// <reference types="vitest/globals" />

import { createFile } from '../src/lib/actions/create-file';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('createFile', () => {
  test('creates file with utf8 encoding', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        content: 'Hello, World!',
        fileName: 'test.txt',
        encoding: 'utf8',
      },
    });
    const result = await createFile.run(ctx);
    expect(result).toEqual({
      fileName: 'test.txt',
      url: 'test-file-url',
    });
  });
});
