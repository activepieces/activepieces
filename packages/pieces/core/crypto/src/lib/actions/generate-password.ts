import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { randomInt } from 'crypto';
import { generatePasswordActionOutputSchema } from '../output-schemas';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const generatePassword = createAction({
  audience: 'both',
  name: 'generate-password',
  classification: 'READ',
  description: 'Generates a random password with the specified length',
  aiMetadata: { description: 'Generates a random password of a given length, from either an alphanumeric character set or alphanumeric plus symbols. Pick this when a flow needs a fresh secret or random token to hand to a later step; it is a value generator, not a digest, so use Text to Hash or Generate HMAC Signature to hash existing text. Length must be 256 or less; not idempotent: every call returns a different password, so capture the output once and reuse it rather than re-running.', idempotent: false },
  displayName: 'Generate Password',
  outputSchema: generatePasswordActionOutputSchema,
  propertyGroups: [
    { key: 'password', display: 'section', label: 'Password', icon: 'sliders', props: ['length', 'characterSet'] },
  ],
  props: {
    length: Property.Number({
      displayName: 'Length',
      description: 'Number of characters, up to 256.',
      required: true,
      defaultValue: 16,
    }),
    characterSet: Property.StaticDropdown({
      displayName: 'Character Set',
      description: 'Add symbols if the site accepts them.',
      required: true,
      defaultValue: 'alphanumeric',
      display: 'cards',
      options: {
        options: [
          { label: 'Alphanumeric', value: 'alphanumeric' },
          { label: 'With Symbols', value: 'alphanumeric-symbols' },
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
      const randomIndex = randomInt(charset.length);
      password += charset[randomIndex];
    }

    return password;
  },
});
