import { PieceAuth } from '@activepieces/pieces-framework';
import { useinboxClient } from './client';

export const useinboxAuth = PieceAuth.BasicAuth({
  description: `Connect your INBOX account by entering the email and password you use to sign in at https://app.useinbox.com.

Each request exchanges these credentials for a short-lived bearer token, so make sure the credentials belong to a user that has access to the API.`,
  required: true,
  username: {
    displayName: 'Email',
    description: 'The email address you sign in to INBOX with.',
  },
  password: {
    displayName: 'Password',
    description: 'Your INBOX account password.',
  },
  validate: async ({ auth }) => {
    try {
      await useinboxClient.fetchAccessToken({
        email: auth.username,
        password: auth.password,
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid INBOX credentials. Double-check your email and password.',
      };
    }
  },
});
