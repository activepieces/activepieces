import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { AppConnectionType } from '@activepieces/shared';

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

export type GoogleDriveAuthValue = AppConnectionValueForAuthProperty<typeof googleDriveAuth>;

export async function createGoogleClient(auth: GoogleDriveAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = JSON.parse(auth.props.serviceAccount);
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

export const common = {
  properties: {
    parentFolder: Property.Dropdown({
      displayName: 'Parent Folder',
      required: false,
      auth: googleDriveAuth,
      refreshers: ['include_team_drives'],
      options: async ({ auth, include_team_drives }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const authValue = auth as GoogleDriveAuthValue;
        const accessToken = await getAccessToken(authValue);
        let folders: { id: string; name: string }[] = [];
        let pageToken = null;
        do {
          const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
              q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
              includeItemsFromAllDrives: include_team_drives ? 'true' : 'false',
              supportsAllDrives: 'true',
            },
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: accessToken,
            },
          };
          if (pageToken) {
            if (request.queryParams !== undefined) {
              request.queryParams['pageToken'] = pageToken;
            }
          }
          try {
            const response = await httpClient.sendRequest<{
              files: { id: string; name: string }[];
              nextPageToken: string;
            }>(request);
            folders = folders.concat(response.body.files);
            pageToken = response.body.nextPageToken;
          } catch (e) {
            throw new Error(`Failed to get folders\nError:${e}`);
          }
        } while (pageToken);

        return {
          disabled: false,
          options: folders.map((folder: { id: string; name: string }) => {
            return {
              label: folder.name,
              value: folder.id,
            };
          }),
        };
      },
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },

  async getFiles(
    auth: GoogleDriveAuthValue,
    search?: {
      parent?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
      includeTeamDrive?: boolean;
    },
    order?: string
  ) {
    const authClient = await createGoogleClient(auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const q: string[] = [];
    if (search?.parent) q.push(`'${search.parent}' in parents`);
    if (search?.createdTime)
      q.push(
        `createdTime ${search.createdTimeOp ?? '>'} '${dayjs(
          search.createdTime
        ).format()}'`
      );
    q.push(`trashed = false`);
    const response = await drive.files.list({
      q: q.concat("mimeType!='application/vnd.google-apps.folder'").join(' and '),
      fields: 'files(id, name, mimeType, webViewLink, kind)',
      orderBy: order ?? 'createdTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: search?.includeTeamDrive,
    });

    return response.data.files;
  },

  async getFolders(
    auth: GoogleDriveAuthValue,
    search?: {
      parent?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
      includeTeamDrive?: boolean;
    },
    order?: string
  ) {
    const q: string[] = [`mimeType='application/vnd.google-apps.folder'`];
    if (search?.parent) q.push(`'${search.parent}' in parents`);
    if (search?.createdTime)
      q.push(
        `createdTime ${search.createdTimeOp ?? '>'} '${dayjs(
          search.createdTime
        ).format()}'`
      );
    q.push(`trashed = false`);
    const response = await httpClient.sendRequest<{
      files: { id: string; name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files`,
      queryParams: {
        q: q.join(' and '),
        orderBy: order ?? 'createdTime desc',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: search?.includeTeamDrive? 'true':'false',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(auth),
      },
    });

    return response.body.files;
  },
};
