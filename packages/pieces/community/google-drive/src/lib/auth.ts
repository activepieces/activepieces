import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDriveScopes = ['https://www.googleapis.com/auth/drive'];

export const googleDriveAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: googleDriveScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access files without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to files/folders you explicitly share with it.',
  required: true,
  props: {
    serviceAccount: Property.LongText({
      displayName: 'Service Account JSON Key',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Email address of the user to impersonate for domain-wide delegation.',
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

export type GoogleDriveAuthValue = AppConnectionValueForAuthProperty<typeof googleDriveAuth>;

export async function createGoogleClient(auth: GoogleDriveAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(auth.props.serviceAccount);
    } catch {
      throw new Error('Invalid Service Account JSON Key. Please provide a valid JSON string.');
    }
    return new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: googleDriveScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GoogleDriveAuthValue): Promise<string> => {
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
