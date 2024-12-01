import {
  createAction,
  OAuth2PropertyValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  googleSheetsCommon,
} from '../common/common';
import { googleSheetsAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { drive_v3, sheets_v4 } from 'googleapis';

export const createSpreadsheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'create-spreadsheet',
  displayName: 'Create Spreadsheet',
  description: 'Creates a blank spreadsheet.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new spreadsheet.',
      required: true,
    }),
    include_team_drives: googleSheetsCommon.include_team_drives,
    folder: Property.Dropdown({
      displayName: 'Parent Folder',
      description:
        'The folder to create the worksheet in.By default, the new worksheet is created in the root folder of drive.',
      required: false,
      refreshers: [],
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
  },
  async run(context) {
    const { title, folder } = context.propsValue
    const response = await createSpreadsheet(context.auth, title);
    const newSpreadsheetId = response.spreadsheetId;

    if (folder && newSpreadsheetId) {
      await moveFile(context.auth, newSpreadsheetId, folder);
    }

    return {
      id: newSpreadsheetId,
    };
  },
});


async function createSpreadsheet(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  title: string
) {
  const response = await httpClient.sendRequest<sheets_v4.Schema$Spreadsheet>({
    method: HttpMethod.POST,
    url: 'https://sheets.googleapis.com/v4/spreadsheets',
    body: {
      properties: {
        title,
      },
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return response.body;
}

async function moveFile(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  fileId: string,
  folderId: string
) {
  const response = await httpClient.sendRequest<drive_v3.Schema$File>({
    method: HttpMethod.PUT,
    url: `https://www.googleapis.com/drive/v2/files/${fileId}`,
    queryParams: {
      addParents: folderId,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return response.body;
}
