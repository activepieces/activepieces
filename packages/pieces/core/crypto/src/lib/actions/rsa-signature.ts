import { createAction, Property } from '@activepieces/pieces-framework';
import Crypto from 'crypto';

export const rsaSignature = createAction({
  audience: 'both',
  name: 'rsa-signature',
  displayName: 'Generate RSA Signature',
  description:
    'Signs text with an RSA private key using SHA-256, SHA-384, or SHA-512 (RSA-SHA256 by default)',
  aiMetadata: { description: 'Signs a text payload with an RSA private key in PEM format (PKCS#1 or PKCS#8), hashing with SHA-256, SHA-384 or SHA-512. Pick this for asymmetric request signing where the verifier holds only the public key; use Generate HMAC Signature when both sides share one symmetric secret, and Text to Hash for a plain unkeyed digest. Requires the private key plus its passphrase if the key is encrypted; signing uses deterministic PKCS#1 v1.5 padding, so it is idempotent.', idempotent: true },
  props: {
    privateKey: Property.LongText({
      displayName: 'Private Key',
      description: 'The RSA private key in PEM format (PKCS#1 or PKCS#8)',
      required: true,
    }),
    passphrase: Property.ShortText({
      displayName: 'Passphrase',
      description:
        'The passphrase protecting the private key, leave empty if it is not encrypted',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'The hashing algorithm to use',
      required: true,
      defaultValue: 'sha256',
      options: {
        options: [
          { label: 'SHA256', value: 'sha256' },
          { label: 'SHA384', value: 'sha384' },
          { label: 'SHA512', value: 'sha512' },
        ],
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to be signed',
      required: true,
    }),
    outputEncoding: Property.StaticDropdown<'hex' | 'base64'>({
      displayName: 'Output Encoding',
      description: 'The encoding of the output signature',
      required: false,
      defaultValue: 'base64',
      options: {
        options: [
          { label: 'Base64', value: 'base64' },
          { label: 'Hex', value: 'hex' },
        ],
      },
    }),
  },
  async run(context) {
    const { privateKey, passphrase, method, text, outputEncoding } =
      context.propsValue;

    const sign = Crypto.createSign(method);
    sign.update(text);
    sign.end();

    const key = passphrase ? { key: privateKey, passphrase } : privateKey;

    return sign.sign(key, outputEncoding ?? 'base64');
  },
});
