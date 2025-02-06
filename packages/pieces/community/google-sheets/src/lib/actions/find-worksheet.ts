import { googleSheetsAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const findWorksheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'find-worksheet',
  displayName: 'Find Worksheet',
  description: 'Finds a worksheet by title.',
  props: {
    include_team_drives: googleSheetsCommon.include_team_drives,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
  },
  async run(context) {
    const spreadsheetId = context.propsValue.spreadsheet_id;
    const title = context.propsValue.title;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetsData = response.data.sheets ?? [];

    const matchedSheet = sheetsData.find(
      (sheet) => sheet.properties?.title === title
    );

    return {
      found: !!matchedSheet,
      worksheet: matchedSheet ?? {},
    };
  },
});
