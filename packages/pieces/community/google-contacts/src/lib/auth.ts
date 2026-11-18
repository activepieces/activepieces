import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'google-auth-library';

export const googleContactsAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/contacts', 'email'],
});

export function createGoogleClient(auth: GoogleContactsAuthValue): OAuth2Client {
  const authClient = new OAuth2Client();
  authClient.setCredentials({ access_token: auth.access_token });
  return authClient;
}

export type GoogleContactsAuthValue = AppConnectionValueForAuthProperty<typeof googleContactsAuth>;
