import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleFormsScopes = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const googleFormsAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: googleFormsScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access forms without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to files/folders you explicitly share with it.',
  required: true,
  props: {
    serviceAccount: Property.ShortText({
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

export type GoogleFormsAuthValue = AppConnectionValueForAuthProperty<typeof googleFormsAuth>;

export async function createGoogleClient(auth: GoogleFormsAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = parseServiceAccount(auth.props.serviceAccount);
    return new google.auth.JWT({
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

export async function callFormsApi<T>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: GoogleFormsAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const accessToken = await getAccessToken(auth);
  const request: HttpRequest = {
    url: `https://forms.googleapis.com/v1${path}`,
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    ...(queryParams ? { queryParams } : {}),
    ...(body === undefined ? {} : { body }),
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export const googleFormsCommon = {
  include_team_drives: Property.Checkbox({
    displayName: 'Include Team Drive Forms',
    description:
      'Determines if forms from Team Drives should be included in the results.',
    defaultValue: false,
    required: false,
  }),
  form_id: Property.Dropdown({
    displayName: 'Form',
    required: true,
    auth: googleFormsAuth,
    refreshers: ['include_team_drives'],
    options: async ({ auth, include_team_drives }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authValue = auth as GoogleFormsAuthValue;
      const accessToken = await getAccessToken(authValue);
      const files = (
        await httpClient.sendRequest<{ files: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
              q: "mimeType='application/vnd.google-apps.form'",
              includeItemsFromAllDrives: include_team_drives ? 'true' : 'false',
              supportsAllDrives: 'true',
            },
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: accessToken,
            },
          }
        )
      ).body.files;
      return {
        disabled: false,
        options: files.map((file: { id: string; name: string }) => {
          return {
            label: file.name,
            value: file.id,
          };
        }),
      };
    },
  }),
};

function parseServiceAccount(raw: string): { client_email: string; private_key: string } {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.client_email !== 'string' || typeof parsed?.private_key !== 'string') {
      throw new Error('Service Account JSON is missing required fields (client_email, private_key)');
    }
    return parsed;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Service Account JSON Key is not valid JSON');
    }
    throw e;
  }
}
