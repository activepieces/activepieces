import { createAction, Property } from '@activepieces/pieces-framework';
import { rsaSignatureActionOutputSchema } from '../output-schemas';
import Crypto from 'crypto';

export const rsaSignature = createAction({
  audience: 'both',
  name: 'rsa-signature',
  classification: 'READ',
  displayName: 'Generate RSA Signature',
  description: 'Signs text with an RSA private key.',
  aiMetadata: { description: 'Signs a text payload with an RSA private key in PEM format (PKCS#1 or PKCS#8), hashing with SHA-256, SHA-384 or SHA-512. Pick this for asymmetric request signing where the verifier holds only the public key; use Generate HMAC Signature when both sides share one symmetric secret, and Text to Hash for a plain unkeyed digest. Requires the private key plus its passphrase if the key is encrypted; signing uses deterministic PKCS#1 v1.5 padding, so it is idempotent.', idempotent: true },
  outputSchema: rsaSignatureActionOutputSchema,
  propertyGroups: [
    { key: 'key', display: 'section', label: 'Signing key', icon: 'code', props: ['privateKey', 'passphrase'] },
    { key: 'signature', display: 'section', label: 'Signature', icon: 'sliders', props: ['text', 'method', 'outputEncoding'] },
  ],
  props: {
    privateKey: Property.LongText({
      displayName: 'Private Key',
      description: 'The RSA private key in PEM format (PKCS#1 or PKCS#8)',
      required: true,
      placeholder: '-----BEGIN PRIVATE KEY-----',
    }),
    passphrase: Property.ShortText({
      displayName: 'Passphrase',
      description: 'Only needed if the private key is encrypted.',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Algorithm',
      description: 'Use the algorithm the receiving service expects.',
      required: true,
      defaultValue: 'sha256',
      display: 'cards',
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
      description: 'The exact text to sign, such as a request body.',
      required: true,
      placeholder: '{"id": 123}',
    }),
    outputEncoding: Property.StaticDropdown<'hex' | 'base64'>({
      displayName: 'Output Encoding',
      description: 'How the signature is written. Base64 if left empty.',
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
