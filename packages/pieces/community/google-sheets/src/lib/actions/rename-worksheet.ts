import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, sheetIdProp, spreadsheetIdProp } from '../common/props';
import { google } from 'googleapis';
import { createGoogleClient } from '../common/common';

export const renameWorksheetAction = createAction({
    auth: googleSheetsAuth,
    name: 'rename-worksheet',
    displayName: 'Rename Worksheet',
    description: 'Rename specific worksheet.',
    audience: 'both',
    aiMetadata: {
        description:
            'Changes the title of an existing worksheet, identified by its stable sheet id, within a spreadsheet. Use when an agent needs to relabel a tab. Idempotent — re-running with the same new name leaves the title unchanged.',
        idempotent: true,
    },
    props: {
        includeTeamDrives: includeTeamDrivesProp(),
        spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The ID of the spreadsheet to use.'),
        sheetId: sheetIdProp('Worksheet', 'The ID of the worksheet to rename.'),
        newName:Property.ShortText({
            displayName:'New Sheet Name',
            required:true
        })
    },
    async run(context) {
        const authClient = await createGoogleClient(context.auth);
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: context.propsValue.spreadsheetId,
            requestBody: {
                requests:[
                    {
                        updateSheetProperties:{
                            properties:{
                                sheetId:context.propsValue.sheetId,
                                title:context.propsValue.newName,
                            },
                            fields:'title'
                        }
                    }
                ]
            },
        });

        return response.data;
    },
});
