import { createAction, Property } from '@activepieces/pieces-framework';
import Crypto from 'crypto';
import { Buffer } from 'buffer';

export const hmacSignature = createAction({
  name: 'hmac-signature',
  description:
    'Converts text to a HMAC signed hash value using various hashing algorithms',
  displayName: 'Generate HMAC Signature',
  props: {
    secretKey: Property.ShortText({
      displayName: 'Secret key',
      description: 'The secret key to encrypt',
      required: true,
    }),
    secretKeyEncoding: Property.StaticDropdown<'utf-8' | 'hex' | 'base64'>({
      displayName: 'Secret key encoding',
      description: 'The secret key encoding to use',
      required: true,
      options: {
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'Hex', value: 'hex' },
          { label: 'Base64', value: 'base64' },
        ],
      },
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'The hashing algorithm to use',
      required: true,
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
      description: 'The text to be hashed and encrypted',
      required: true,
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

    const hashedString = hashAlgorithm.digest('hex');

    return hashedString;
  },
});
