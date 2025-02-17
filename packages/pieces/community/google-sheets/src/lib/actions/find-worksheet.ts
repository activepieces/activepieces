import { googleSheetsAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';

export const findWorksheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'find-worksheet',
  displayName: 'Find Worksheet(s)',
  description: 'Finds a worksheet(s) by title.',
  props: {
    includeTeamDrives: includeTeamDrivesProp(),
    spreadsheetId:spreadsheetIdProp('Spreadsheet',''),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'If true, only return worksheets that exactly match the name. If false, return worksheets that contain the name.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const spreadsheetId = context.propsValue.spreadsheetId;
    const title = context.propsValue.title;
    const exactMatch = context.propsValue.exact_match ?? false;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetsData = response.data.sheets ?? [];

    const matchedSheets = sheetsData.filter((sheet) => {
      const sheetTitle = sheet.properties?.title ?? "";
      return exactMatch ? sheetTitle === title : sheetTitle.includes(title);
    });

    return {
      found: matchedSheets.length > 0,
      worksheets: matchedSheets ,
    };
  },
});
