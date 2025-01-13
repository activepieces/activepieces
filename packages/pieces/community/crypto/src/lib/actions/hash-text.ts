import { Property, createAction } from '@activepieces/pieces-framework';
import Crypto from 'crypto';

export const hashText = createAction({
  name: 'hash-text',
  description: 'Converts text to a hash value using various hashing algorithms',
  displayName: 'Text to Hash',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'The hashing algorithm to use',
      required: true,
      options: {
        options: [
          { label: 'MD5', value: 'md5' },
          { label: 'SHA256', value: 'sha256' },
          { label: 'SHA512', value: 'sha512' },
          { label: 'SHA3-512', value: 'sha3-512' },
        ],
      },
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'The text to be hashed',
      required: true,
    }),
  },
  async run(context) {

    const hashAlgorithm = Crypto.createHash(context.propsValue.method);

    const text = context.propsValue.text;
    hashAlgorithm.update(text);

    const hashedString = hashAlgorithm.digest('hex');

    return hashedString;
  },
});
