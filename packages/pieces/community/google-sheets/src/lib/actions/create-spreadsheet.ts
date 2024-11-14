import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  createSpreadsheet,
  googleSheetsCommon,
  moveFile,
} from '../common/common';
import { googleSheetsAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

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
    // spreadsheet_id: googleSheetsCommon.spreadsheet_id(false,'Spreadsheet to Copy'),
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
    const title = context.propsValue.title;
    const folder = context.propsValue.folder;

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
