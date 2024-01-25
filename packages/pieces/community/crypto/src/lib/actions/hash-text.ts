import { Property, createAction } from '@activepieces/pieces-framework';
import Crypto from 'crypto';

export const hashText = createAction({
  name: 'hash-text',
  description: 'Converts text to hash',
  displayName: 'Text to Hash',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'The method of hashing',
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
      description: 'The text to hash',
      required: true,
    }),
  },
  async run(context) {

    const md5Hash = Crypto.createHash(context.propsValue.method);

    const text = context.propsValue.text;
    md5Hash.update(text);

    const hashedString = md5Hash.digest('hex');

    return hashedString;
  },
});
