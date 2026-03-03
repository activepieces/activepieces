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
import { googleDriveAuth } from '../auth';

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
    const allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const listParams: Record<string, any> = {
        q: q.concat("mimeType!='application/vnd.google-apps.folder'").join(' and '),
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, kind, createdTime)',
        orderBy: order ?? 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: search?.includeTeamDrive,
      };
      if (pageToken) listParams.pageToken = pageToken;
      const response = await drive.files.list(listParams);
      allFiles.push(...(response.data.files ?? []));
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return allFiles;
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
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const q: string[] = [`mimeType='application/vnd.google-apps.folder'`];
    if (search?.parent) q.push(`'${search.parent}' in parents`);
    if (search?.createdTime)
      q.push(
        `createdTime ${search.createdTimeOp ?? '>'} '${dayjs(
          search.createdTime
        ).format()}'`
      );
    q.push(`trashed = false`);
    const allFolders: any[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const listParams: Record<string, any> = {
        q: q.join(' and '),
        fields: 'nextPageToken, files(id, name)',
        orderBy: order ?? 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: search?.includeTeamDrive,
      };
      if (pageToken) listParams.pageToken = pageToken;
      const response = await drive.files.list(listParams);
      allFolders.push(...(response.data.files ?? []));
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return allFolders;
  },
};
