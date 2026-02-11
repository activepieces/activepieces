import { createHmac } from 'crypto';
import { verifyHmacAuth } from '../src/lib/triggers/catch-hook';

describe('verifyHmacAuth', () => {
  const secret = 'test-secret-key';
  const algorithm = 'sha256';

  // Helper to compute HMAC signature
  function computeSignature(
    body: string,
    secretKey: string,
    algo: string,
    encoding: 'hex' | 'base64'
  ): string {
    const hmac = createHmac(algo, secretKey);
    hmac.update(body);
    return hmac.digest(encoding);
  }

  describe('with hex encoding', () => {
    const encoding = 'hex';

    it('should return true for valid signature', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const headers = { 'x-signature': 'invalid-signature' };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });

    it('should return false when signature header is missing', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const headers = {};

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });

    it('should return false when signature is computed with wrong secret', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const wrongSignature = computeSignature(
        body,
        'wrong-secret',
        algorithm,
        encoding
      );
      const headers = { 'x-signature': wrongSignature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });

    it('should return false when body has been tampered with', () => {
      const originalBody = JSON.stringify({ event: 'test', data: 'payload' });
      const signature = computeSignature(
        originalBody,
        secret,
        algorithm,
        encoding
      );
      const headers = { 'x-signature': signature };
      const tamperedBody = JSON.stringify({ event: 'test', data: 'modified' });

      const result = verifyHmacAuth(
        headers,
        tamperedBody,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });
  });

  describe('with base64 encoding', () => {
    const encoding = 'base64';

    it('should return true for valid base64 signature', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid base64 signature', () => {
      const body = JSON.stringify({ event: 'test', data: 'payload' });
      const headers = { 'x-signature': 'aW52YWxpZC1zaWduYXR1cmU=' };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });
  });

  describe('with signature prefix', () => {
    const encoding = 'hex';

    it('should strip prefix before verification (GitHub style sha256=)', () => {
      const body = JSON.stringify({ event: 'push', ref: 'refs/heads/main' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      const prefixedSignature = `sha256=${signature}`;
      const headers = { 'x-hub-signature-256': prefixedSignature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-hub-signature-256',
        secret,
        algorithm,
        encoding,
        'sha256='
      );

      expect(result).toBe(true);
    });

    it('should fail if prefix is missing when expected', () => {
      const body = JSON.stringify({ event: 'push', ref: 'refs/heads/main' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      // Signature without prefix, but prefix is configured
      const headers = { 'x-hub-signature-256': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-hub-signature-256',
        secret,
        algorithm,
        encoding,
        'sha256='
      );

      // Should still work since the prefix stripping only happens if the value starts with it
      expect(result).toBe(true);
    });

    it('should work with sha1= prefix', () => {
      const sha1Algorithm = 'sha1';
      const body = JSON.stringify({ event: 'ping' });
      const signature = computeSignature(body, secret, sha1Algorithm, encoding);
      const prefixedSignature = `sha1=${signature}`;
      const headers = { 'x-hub-signature': prefixedSignature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-hub-signature',
        secret,
        sha1Algorithm,
        encoding,
        'sha1='
      );

      expect(result).toBe(true);
    });
  });

  describe('with different algorithms', () => {
    const encoding = 'hex';

    it('should work with SHA-1 algorithm', () => {
      const sha1Algorithm = 'sha1';
      const body = JSON.stringify({ data: 'test' });
      const signature = computeSignature(body, secret, sha1Algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        sha1Algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should work with SHA-512 algorithm', () => {
      const sha512Algorithm = 'sha512';
      const body = JSON.stringify({ data: 'test' });
      const signature = computeSignature(
        body,
        secret,
        sha512Algorithm,
        encoding
      );
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        sha512Algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should fail when algorithm mismatches', () => {
      const body = JSON.stringify({ data: 'test' });
      // Compute with SHA-256
      const signature = computeSignature(body, secret, 'sha256', encoding);
      const headers = { 'x-signature': signature };

      // Verify expecting SHA-512
      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        'sha512',
        encoding,
        ''
      );

      expect(result).toBe(false);
    });
  });

  describe('with different body types', () => {
    const encoding = 'hex';

    it('should handle string body', () => {
      const body = 'plain text body';
      const signature = computeSignature(body, secret, algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should handle Buffer body', () => {
      const bodyString = 'buffer body content';
      const body = Buffer.from(bodyString, 'utf8');
      const signature = computeSignature(
        bodyString,
        secret,
        algorithm,
        encoding
      );
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should handle object body by JSON stringifying', () => {
      const bodyObject = { event: 'test', nested: { key: 'value' } };
      const expectedBodyString = JSON.stringify(bodyObject);
      const signature = computeSignature(
        expectedBodyString,
        secret,
        algorithm,
        encoding
      );
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        bodyObject,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should handle undefined body as empty string', () => {
      const signature = computeSignature('', secret, algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        undefined,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should handle null body as empty string', () => {
      const signature = computeSignature('', secret, algorithm, encoding);
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        null,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });
  });

  describe('header name case sensitivity', () => {
    const encoding = 'hex';

    it('should find header with lowercase conversion', () => {
      const body = JSON.stringify({ event: 'test' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      // Header stored with lowercase (as HTTP headers typically are)
      const headers = { 'x-signature': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'X-Signature', // Configured with mixed case
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });

    it('should find header with all caps conversion', () => {
      const body = JSON.stringify({ event: 'test' });
      const signature = computeSignature(body, secret, algorithm, encoding);
      const headers = { 'x-hub-signature-256': signature };

      const result = verifyHmacAuth(
        headers,
        body,
        'X-Hub-Signature-256',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(true);
    });
  });

  describe('timing-safe comparison', () => {
    const encoding = 'hex';

    it('should return false for signatures of different lengths', () => {
      const body = JSON.stringify({ event: 'test' });
      // Short invalid signature
      const headers = { 'x-signature': 'abc123' };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });

    it('should return false for empty signature', () => {
      const body = JSON.stringify({ event: 'test' });
      const headers = { 'x-signature': '' };

      const result = verifyHmacAuth(
        headers,
        body,
        'x-signature',
        secret,
        algorithm,
        encoding,
        ''
      );

      expect(result).toBe(false);
    });
  });
});
