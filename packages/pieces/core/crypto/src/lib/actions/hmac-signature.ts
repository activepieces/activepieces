import { createAction, Property } from '@activepieces/pieces-framework';
import { hmacSignatureActionOutputSchema } from '../output-schemas';
import Crypto from 'crypto';
import { Buffer } from 'buffer';

export const hmacSignature = createAction({
  audience: 'both',
  name: 'hmac-signature',
  classification: 'READ',
  description: 'Signs text with a shared secret key using HMAC.',
  aiMetadata: { description: 'Computes a keyed HMAC digest of a text string with a secret key, selecting the hash algorithm and how the secret key itself is interpreted (UTF-8, hex or base64). Pick this to sign or verify webhook payloads and API requests that use a shared secret; use Text to Hash for an unkeyed digest and Generate RSA Signature for asymmetric private-key signing. The secret-key encoding must match how the key was issued or the signature will not match; pure computation and idempotent.', idempotent: true },
  displayName: 'Generate HMAC Signature',
  outputSchema: hmacSignatureActionOutputSchema,
  propertyGroups: [
    { key: 'key', display: 'section', label: 'Signing key', icon: 'code', props: ['secretKey', 'secretKeyEncoding'] },
    { key: 'signature', display: 'section', label: 'Signature', icon: 'sliders', props: ['text', 'method', 'outputEncoding'] },
  ],
  props: {
    secretKey: Property.ShortText({
      displayName: 'Secret Key',
      description: 'The secret shared with the service that checks the signature.',
      required: true,
    }),
    secretKeyEncoding: Property.StaticDropdown<'utf-8' | 'hex' | 'base64'>({
      displayName: 'Secret Key Encoding',
      description: 'Use UTF-8 for a plain text key. A wrong choice breaks the signature.',
      required: true,
      defaultValue: 'utf-8',
      display: 'cards',
      options: {
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'Hex', value: 'hex' },
          { label: 'Base64', value: 'base64' },
        ],
      },
    }),
    method: Property.StaticDropdown({
      displayName: 'Algorithm',
      description: 'Use the algorithm the receiving service expects.',
      required: true,
      defaultValue: 'sha256',
      display: 'cards',
      options: {
        options: [
          { label: 'MD5', value: 'md5' },
          { label: 'SHA256', value: 'sha256' },
          { label: 'SHA512', value: 'sha512' },
        ],
      },
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The exact text to sign, such as a request body.',
      required: true,
      placeholder: '{"id": 123}',
    }),
    outputEncoding: Property.StaticDropdown<'hex' | 'base64'>({
      displayName: 'Output Encoding',
      description: 'How the signature is written. Hex if left empty.',
      required: false,
      defaultValue: 'hex',
      options: {
        options: [
          { label: 'Hex', value: 'hex' },
          { label: 'Base64', value: 'base64' },
        ],
      },
    }),
  },
  async run(context) {
    const hashAlgorithm = Crypto.createHmac(
      context.propsValue.method,
      Buffer.from(
        context.propsValue.secretKey,
        context.propsValue.secretKeyEncoding
      )
    );

    const text = context.propsValue.text;
    hashAlgorithm.update(text);

    const hashedString = hashAlgorithm.digest(context.propsValue.outputEncoding ?? 'hex');

    return hashedString;
  },
});
