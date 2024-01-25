import {
  Property,
  Validators,
  createAction,
} from '@activepieces/pieces-framework';

export const generatePassword = createAction({
  name: 'generate-password',
  description: 'Generates a random password',
  displayName: 'Generate a random password',
  props: {
    length: Property.Number({
      displayName: 'Password Length',
      description: 'The length of the password',
      required: true,
      validators: [Validators.maxValue(256)],
    }),
  },
  async run(context) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let password = '';

    const length = context.propsValue.length;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  },
});
