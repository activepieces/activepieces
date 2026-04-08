import { PieceAuth } from '@activepieces/pieces-framework';

export const phoneValidatorAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Sign up and create an account at Phone Validator
2. Visit your account information to obtain your API key
3. Copy your API key and paste it here
`,
  required: true,
});
