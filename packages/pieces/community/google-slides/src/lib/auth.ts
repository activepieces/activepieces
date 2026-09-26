import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { JWT, OAuth2Client } from 'google-auth-library';

export const googleSlidesScopes = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'email',
];

export const googleSlidesAuth = [
  PieceAuth.OAuth2({
    description: '',

    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    scope: googleSlidesScopes,
  }),
  PieceAuth.CustomAuth({
    displayName: 'Service Account (Advanced)',
    description:
      'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access presentations without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to files/folders you explicitly share with it. A service account also has no Drive storage of its own, so Generate from Template, which copies the template into a new file, fails unless domain-wide delegation is configured.',
    required: true,
    props: {
      serviceAccount: Property.LongText({
        displayName: 'Service Account JSON Key',
        required: true,
      }),
      userEmail: Property.ShortText({
        displayName: 'User Email',
        required: false,
        description:
          'Email address of the user to impersonate for domain-wide delegation.',
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
  }),
];

export async function createGoogleClient(
  auth: GoogleSlidesAuthValue
): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(auth.props.serviceAccount);
    } catch {
      throw new Error(
        'Invalid Service Account JSON Key. Please provide a valid JSON string.'
      );
    }
    return new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: googleSlidesScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (
  auth: GoogleSlidesAuthValue
): Promise<string> => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const googleClient = await createGoogleClient(auth);
    const response = await googleClient.getAccessToken();
    if (response.token) {
      return response.token;
    } else {
      throw new Error(
        'Could not retrieve access token from service account json'
      );
    }
  }
  return auth.access_token;
};

export type GoogleSlidesAuthValue = AppConnectionValueForAuthProperty<
  typeof googleSlidesAuth
>;
