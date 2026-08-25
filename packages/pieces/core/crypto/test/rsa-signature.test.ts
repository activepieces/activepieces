/// <reference types="vitest/globals" />

import { rsaSignature } from '../src/lib/actions/rsa-signature';
import { createMockActionContext } from '@activepieces/pieces-framework';
import Crypto from 'crypto';

const { privateKey, publicKey } = Crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('rsaSignature', () => {
  test('produces a signature that verifies with the public key (RSA-SHA256, base64)', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        privateKey,
        method: 'sha256' as const,
        text: 'hello world',
        outputEncoding: 'base64' as const,
      },
    });
    const signature = await rsaSignature.run(ctx);
    expect(typeof signature).toBe('string');

    const verified = Crypto.verify(
      'sha256',
      Buffer.from('hello world'),
      publicKey,
      Buffer.from(signature as string, 'base64')
    );
    expect(verified).toBe(true);
  });

  test('hex and base64 outputs decode to the same signature bytes', async () => {
    const base = {
      privateKey,
      method: 'sha256' as const,
      text: 'crc_token_value',
    };
    const hexResult = await rsaSignature.run(
      createMockActionContext({ propsValue: { ...base, outputEncoding: 'hex' as const } })
    );
    const b64Result = await rsaSignature.run(
      createMockActionContext({ propsValue: { ...base, outputEncoding: 'base64' as const } })
    );
    expect(Buffer.from(b64Result as string, 'base64').toString('hex')).toBe(hexResult);
  });

  test('signature does not verify against tampered text', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        privateKey,
        method: 'sha256' as const,
        text: 'original',
        outputEncoding: 'base64' as const,
      },
    });
    const signature = await rsaSignature.run(ctx);

    const verified = Crypto.verify(
      'sha256',
      Buffer.from('tampered'),
      publicKey,
      Buffer.from(signature as string, 'base64')
    );
    expect(verified).toBe(false);
  });

  test('signs with a passphrase-protected private key (SHA512)', async () => {
    const passphrase = 'topsecret';
    const encrypted = Crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase,
      },
    });
    const ctx = createMockActionContext({
      propsValue: {
        privateKey: encrypted.privateKey,
        passphrase,
        method: 'sha512' as const,
        text: 'data to sign',
        outputEncoding: 'base64' as const,
      },
    });
    const signature = await rsaSignature.run(ctx);

    const verified = Crypto.verify(
      'sha512',
      Buffer.from('data to sign'),
      encrypted.publicKey,
      Buffer.from(signature as string, 'base64')
    );
    expect(verified).toBe(true);
  });
});
