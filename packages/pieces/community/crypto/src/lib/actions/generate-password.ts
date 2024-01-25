import {
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';

export const generatePassword = createAction({
  name: 'generate-password',
  description: 'Generates a random password with the specified length',
  displayName: 'Generate Password',
  props: {
    length: Property.Number({
      displayName: 'Password Length',
      description: 'The length of the password (maximum 256)',
      required: true,
      validators: [Validators.maxValue(256)],
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
