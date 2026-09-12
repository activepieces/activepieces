import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { JWT, OAuth2Client } from 'google-auth-library';

export const googleCalendarScopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  // TODO: Add the scope after Google App Verification
  // 'https://www.googleapis.com/auth/calendar.calendarlist'
  'email',
];

export const googleCalendarAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  pkce: true,
  scope: googleCalendarScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Create a key under [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts): **Keys** > **Add key** > **JSON**.\n\nShare each calendar with the service account email, or set up [domain-wide delegation](https://support.google.com/a/answer/162106) and fill **User Email** to act as that user.',
  required: true,
  props: {
    serviceAccount: Property.LongText({
      displayName: 'Service Account JSON Key',
      description: 'Paste the whole JSON key file.',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Needed only with domain-wide delegation.',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getAccessToken({
        type: AppConnectionType.CUSTOM_AUTH,
        props: { ...auth },
      });
    } catch (e) {
      return {
        valid: false,
        error: (e as Error).message,
      };
    }
    return {
      valid: true,
    };
  },
})];

export type GoogleCalendarAuthValue = AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;

export async function createGoogleClient(auth: GoogleCalendarAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = JSON.parse(auth.props.serviceAccount);
    return new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: googleCalendarScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GoogleCalendarAuthValue): Promise<string> => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const googleClient = await createGoogleClient(auth);
    const response = await googleClient.getAccessToken();
    if (response.token) {
      return response.token;
    } else {
      throw new Error('Could not retrieve access token from service account json');
    }
  }
  return auth.access_token;
};
