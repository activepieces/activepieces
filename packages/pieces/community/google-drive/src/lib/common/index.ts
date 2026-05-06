import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { google } from 'googleapis';
import { googleDriveAuth, GoogleDriveAuthValue, getAccessToken, createGoogleClient } from '../auth';

const FOLDER_DROPDOWN_PAGE_SIZE = 1000;

const escapeDriveQueryLiteral = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export const common = {
  properties: {
    parentFolder: Property.Dropdown({
      displayName: 'Parent Folder',
      description:
        "The Drive folder to target. Leave empty to use the root of My Drive. Type in the box to search your Drive by folder name. If the folder still isn't listed, switch this field to 'Dynamic value' (the toggle next to the field) and paste the folder ID — you can copy it from the folder's URL in Drive, after /folders/ (e.g. https://drive.google.com/drive/folders/<FOLDER_ID>).",
      required: false,
      auth: googleDriveAuth,
      refreshers: ['include_team_drives'],
      refreshOnSearch: true,
      options: async ({ auth, include_team_drives }, ctx) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const authValue = auth as GoogleDriveAuthValue;
        const accessToken = await getAccessToken(authValue);
        const searchValue = ctx?.searchValue?.trim() ?? '';
        const qParts = [
          "mimeType='application/vnd.google-apps.folder'",
          'trashed = false',
        ];
        if (searchValue.length > 0) {
          qParts.push(`name contains '${escapeDriveQueryLiteral(searchValue)}'`);
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `https://www.googleapis.com/drive/v3/files`,
          queryParams: {
            q: qParts.join(' and '),
            includeItemsFromAllDrives: include_team_drives ? 'true' : 'false',
            supportsAllDrives: 'true',
            pageSize: String(FOLDER_DROPDOWN_PAGE_SIZE),
            fields: 'nextPageToken, files(id, name)',
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        };
        let folders: { id: string; name: string }[] = [];
        let truncated = false;
        try {
          const response = await httpClient.sendRequest<{
            files: { id: string; name: string }[];
            nextPageToken?: string;
          }>(request);
          folders = response.body.files ?? [];
          truncated = Boolean(response.body.nextPageToken);
        } catch (e) {
          throw new Error(`Failed to get folders\nError:${e}`);
        }

        return {
          disabled: false,
          placeholder: truncated
            ? `Showing first ${folders.length} matches — type to narrow the list, or switch to Dynamic value to paste an ID.`
            : undefined,
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
        fields: 'nextPageToken, files(id, name, createdTime)',
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
