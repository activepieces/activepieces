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

  test('generates symbols password from the symbols charset only', async () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const ctx = createMockActionContext({
      propsValue: { length: 200, characterSet: 'alphanumeric-symbols' },
    });
    const result = await generatePassword.run(ctx);
    const password = typeof result === 'string' ? result : '';
    expect(password).toHaveLength(200);
    expect([...password].every((ch) => charset.includes(ch))).toBe(true);
  });

  test('never uses Math.random to pick characters', async () => {
    const mathRandom = vi.spyOn(Math, 'random');
    const ctx = createMockActionContext({
      propsValue: { length: 64, characterSet: 'alphanumeric-symbols' },
    });
    await generatePassword.run(ctx);
    expect(mathRandom).not.toHaveBeenCalled();
    mathRandom.mockRestore();
  });

  test('throws on invalid length (> 256)', async () => {
    const ctx = createMockActionContext({
      propsValue: { length: 300, characterSet: 'alphanumeric' },
    });
    await expect(generatePassword.run(ctx)).rejects.toThrow();
  });
});
