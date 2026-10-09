import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { mailjetApi } from './common/api';

const authDescription = `Connect with a Mailjet API key and secret key.

1. Log in to [Mailjet](https://app.mailjet.com).
2. Open **Account settings** → **REST API** → **API Key Management (Primary and Sub-account)**, or go straight to [API keys](https://app.mailjet.com/account/apikeys).
3. Copy the **API Key** and the **Secret Key** and paste them below. If the secret is hidden, use **Generate Secret Key** and copy the new one.`;

export const mailjetAuth = PieceAuth.BasicAuth({
  description: authDescription,
  required: true,
  username: {
    displayName: 'API Key',
    description: 'The API Key from Mailjet API Key Management.'
  },
  password: {
    displayName: 'Secret Key',
    description: 'The Secret Key that belongs to the API Key.'
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      mailjetApi.get({
        auth: { type: AppConnectionType.BASIC_AUTH, ...auth },
        path: '/v3/REST/user',
      })
    );
    return error
      ? { valid: false, error: 'Invalid API Key or Secret Key.' }
      : { valid: true };
  }
});
