/// <reference types="vitest/globals" />

import { hashText } from '../src/lib/actions/hash-text';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('hashText', () => {
  test('hashes with MD5', async () => {
    const ctx = createMockActionContext({
      propsValue: { method: 'MD5', text: 'hello' },
    });
    const result = await hashText.run(ctx);
    expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  test('hashes with SHA256', async () => {
    const ctx = createMockActionContext({
      propsValue: { method: 'SHA256', text: 'hello' },
    });
    const result = await hashText.run(ctx);
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  test('hashes with SHA512', async () => {
    const ctx = createMockActionContext({
      propsValue: { method: 'SHA512', text: 'hello' },
    });
    const result = await hashText.run(ctx);
    expect(result).toBe('9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043');
  });

  test('hashes empty string', async () => {
    const ctx = createMockActionContext({
      propsValue: { method: 'MD5', text: '' },
    });
    const result = await hashText.run(ctx);
    expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });
});
