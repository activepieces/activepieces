import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const generatePassword = createAction({
  name: 'generate-password',
  description: 'Generates a random password with the specified length',
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
      length: z.number().max(256),
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
