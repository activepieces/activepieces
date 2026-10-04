import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { JWT, OAuth2Client } from 'google-auth-library';

export const googleFormsScopes = [
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'email',
];

export const googleFormsAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: googleFormsScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: `Connect with a Google Cloud service account.

**How to get the key:**
1. Open the [Google Cloud console](https://console.cloud.google.com/iam-admin/serviceaccounts) → **IAM & Admin** → **Service Accounts**.
2. Create a service account, or pick an existing one.
3. Open **Keys** → **Add key** → **Create new key** → **JSON** and download the file.
4. Share each form with the service account's email, or set up [domain-wide delegation](https://support.google.com/a/answer/162106) and fill in **User Email** below.`,
  required: true,
  props: {
    serviceAccount: Property.ShortText({
      displayName: 'Service Account JSON Key',
      required: true,
      description: 'Paste the full contents of the downloaded key file.',
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

export type GoogleFormsAuthValue = AppConnectionValueForAuthProperty<typeof googleFormsAuth>;

export async function createGoogleClient(auth: GoogleFormsAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = JSON.parse(auth.props.serviceAccount);
    return new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: googleFormsScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GoogleFormsAuthValue): Promise<string> => {
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

export const googleFormsCommon = {
  include_team_drives: Property.Checkbox({
    displayName: 'Include Shared Drives',
    description: 'Also include forms stored in shared drives.',
    defaultValue: false,
    required: false,
    advanced: true,
  }),
  form_id: Property.Dropdown({
    displayName: 'Form',
    description: 'The form to watch for new responses.',
    required: true,
    auth: googleFormsAuth,
    refreshers: ['include_team_drives'],
    options: async ({ auth, include_team_drives }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account first',
        };
      }
      const authValue = auth as GoogleFormsAuthValue;
      try {
        const accessToken = await getAccessToken(authValue);
        const files = await listForms({
          accessToken,
          includeTeamDrives: Boolean(include_team_drives),
          pageToken: undefined,
        });
        if (files.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No forms found',
          };
        }
        return {
          disabled: false,
          options: files.map((file) => ({
            label: file.name,
            value: file.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load forms. Check your connection.',
        };
      }
    },
  }),
};

async function listForms({
  accessToken,
  includeTeamDrives,
  pageToken,
}: {
  accessToken: string;
  includeTeamDrives: boolean;
  pageToken: string | undefined;
}): Promise<{ id: string; name: string }[]> {
  const response = await httpClient.sendRequest<{
    files: { id: string; name: string }[];
    nextPageToken?: string;
  }>({
    method: HttpMethod.GET,
    url: `https://www.googleapis.com/drive/v3/files`,
    queryParams: {
      q: "mimeType='application/vnd.google-apps.form' and trashed = false",
      includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
      supportsAllDrives: 'true',
      corpora: includeTeamDrives ? 'allDrives' : 'user',
      pageSize: '1000',
      fields: 'nextPageToken, files(id, name)',
      ...(pageToken ? { pageToken } : {}),
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });
  const { files, nextPageToken } = response.body;
  if (!nextPageToken) {
    return files;
  }
  const remaining = await listForms({
    accessToken,
    includeTeamDrives,
    pageToken: nextPageToken,
  });
  return [...files, ...remaining];
}
