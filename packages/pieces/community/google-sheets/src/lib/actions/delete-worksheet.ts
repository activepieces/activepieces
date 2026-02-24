import { googleSheetsAuth } from '../common/common';
import { createAction } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, sheetIdProp, spreadsheetIdProp } from '../common/props';
import { google } from 'googleapis';
import { createGoogleClient } from '../common/common';

export const deleteWorksheetAction = createAction({
    auth: googleSheetsAuth,
    name: 'delete-worksheet',
    displayName: 'Delete Worksheet',
    description: 'Permanently delete a specific worksheet.',
    props: {
        includeTeamDrives: includeTeamDrivesProp(),
        spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The ID of the spreadsheet to use.'),
        sheetId: sheetIdProp('Worksheet', 'The ID of the worksheet to delete.'),
    },
    async run(context) {
        const authClient = await createGoogleClient(context.auth);
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: context.propsValue.spreadsheetId,
            requestBody: {
                requests:[
                    {
                       deleteSheet:{
                        sheetId:context.propsValue.sheetId
                       }
                    }
                ]
            },
        });

        return response.data;
    },
});
