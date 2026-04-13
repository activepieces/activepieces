import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

const gmailServiceAccountScopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

export const gmailScopes = [
  ...gmailServiceAccountScopes,
  'email',
];

export const gmailAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: gmailScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access Gmail without adding the service account to each mailbox. <br> <br> **Note:** A user email with domain-wide delegation is required for Gmail service account access.',
  required: true,
  props: {
    serviceAccount: Property.LongText({
      displayName: 'Service Account JSON Key',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: true,
      description: 'Email address of the user to impersonate. Required for Gmail service account access via domain-wide delegation.',
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

export type GmailAuthValue = AppConnectionValueForAuthProperty<typeof gmailAuth>;

export async function createGoogleClient(auth: GmailAuthValue): Promise<OAuth2Client> {
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
      scopes: gmailServiceAccountScopes,
      subject: auth.props.userEmail?.trim() || undefined,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GmailAuthValue): Promise<string> => {
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

export async function getUserEmail(auth: GmailAuthValue, authClient: OAuth2Client): Promise<string | undefined> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.userEmail?.trim();
  }
  return (await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get()).data.email ?? undefined;
}
