/// <reference types="vitest/globals" />

import { outputQrcodeAction } from '../src/lib/actions/output-qrcode-action';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('outputQrcodeAction', () => {
  test('generates QR code from text', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'Hello World' },
    });
    const result = await outputQrcodeAction.run(ctx);
    expect(result).toBe('test-file-url');
  });
});
