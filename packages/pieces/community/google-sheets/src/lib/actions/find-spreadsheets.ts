import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from '@activepieces/pieces-common';
import { googleSheetsAuth } from '../..';
import { includeTeamDrivesProp } from '../common/props';

export const findSpreadsheets = createAction({
  name: 'find_spreadsheets',
  displayName: 'Find Spreadsheet(s)',
  description: 'Find spreadsheet(s) by name.',
  auth: googleSheetsAuth,
  props: {
    includeTeamDrives: includeTeamDrivesProp(),
    spreadsheet_name: Property.ShortText({
      displayName: 'Spreadsheet Name',
      description: 'The name of the spreadsheet(s) to find.',
      required: true,
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'If true, only return spreadsheets that exactly match the name. If false, return spreadsheets that contain the name.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth }) {
    const searchValue = propsValue.spreadsheet_name;
    const queries = [
      "mimeType='application/vnd.google-apps.spreadsheet'",
      'trashed=false',
    ];

    if (propsValue.exact_match) {
      queries.push(`name = '${searchValue}'`);
    } else {
      queries.push(`name contains '${searchValue}'`);
    }

    const files = [];
    let pageToken = null;

    do
    {
      const request :HttpRequest = {
        method:HttpMethod.GET,
        url: 'https://www.googleapis.com/drive/v3/files',
        queryParams:{
          q: queries.join(' and '),
          includeItemsFromAllDrives: propsValue.includeTeamDrives ? 'true' : 'false',
          supportsAllDrives: 'true',
          fields: 'files(id,name,webViewLink,createdTime,modifiedTime),nextPageToken',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },

      }
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

        files.push(...response.body.files);
        pageToken = response.body.nextPageToken;
      } catch (e) {
        throw new Error(`Failed to get folders\nError:${e}`);
      }

    }while(pageToken);

    return {
      found: files.length > 0,
      spreadsheets:files,
    };
  },
});
