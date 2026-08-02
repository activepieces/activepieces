import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const generatePassword = createAction({
  audience: 'both',
  name: 'generate-password',
  description: 'Generates a random password with the specified length',
  aiMetadata: { description: 'Generates a random password of a given length, from either an alphanumeric character set or alphanumeric plus symbols. Pick this when a flow needs a fresh secret or random token to hand to a later step; it is a value generator, not a digest, so use Text to Hash or Generate HMAC Signature to hash existing text. Length must be 256 or less; not idempotent: every call returns a different password, so capture the output once and reuse it rather than re-running.', idempotent: false },
  displayName: 'Generate Password',
  props: {
    length: Property.Number({
      displayName: 'Password Length',
      description: 'The length of the password (maximum 256)',
      required: true,
    }),
    characterSet: Property.StaticDropdown({
      displayName: 'Character Set',
      description: 'The character set to use when generating the password',
      required: true,
      defaultValue: 'alphanumeric',
      options: {
        options: [
          { label: 'Alphanumeric', value: 'alphanumeric' },
          { label: 'Alphanumeric + Symbols', value: 'alphanumeric-symbols' },
        ],
      },
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      length: z.number().check(z.maximum(256)),
    });

    const charset = context.propsValue.characterSet === 'alphanumeric'
      ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let password = '';
    const length = context.propsValue.length;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  },
});
