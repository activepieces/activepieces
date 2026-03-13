/// <reference types="vitest/globals" />

import { generatePassword } from '../src/lib/actions/generate-password';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('generatePassword', () => {
  test('generates password with correct length', async () => {
    const ctx = createMockActionContext({
      propsValue: { length: 16, characterSet: 'alphanumeric' },
    });
    const result = await generatePassword.run(ctx);
    expect(result).toHaveLength(16);
  });

  test('generates alphanumeric password', async () => {
    const ctx = createMockActionContext({
      propsValue: { length: 100, characterSet: 'alphanumeric' },
    });
    const result = await generatePassword.run(ctx);
    expect(result).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('throws on invalid length (> 256)', async () => {
    const ctx = createMockActionContext({
      propsValue: { length: 300, characterSet: 'alphanumeric' },
    });
    await expect(generatePassword.run(ctx)).rejects.toThrow();
  });
});
