import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';

export const common = {
  properties: {
    parentFolder: Property.Dropdown({
      displayName: 'Parent Folder',
      required: false,
      refreshers: ['include_team_drives'],
      options: async ({ auth, include_team_drives }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
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
              token: authProp!['access_token'],
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
    auth: OAuth2PropertyValue,
    search?: {
      parent?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
      includeTeamDrive?: boolean;
    },
    order?: string
  ) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

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
    auth: OAuth2PropertyValue,
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
        token: auth.access_token,
      },
    });

    return response.body.files;
  },
};
