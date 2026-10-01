import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { includeTeamDrivesProp, sheetIdProp, spreadsheetIdProp } from '../common/props';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient } from '../common/common';
import { renameWorksheetActionOutputSchema } from '../output-schemas';

export const renameWorksheetAction = createAction({
    auth: googleSheetsAuth,
    name: 'rename-worksheet',
    classification: 'WRITE',
    displayName: 'Rename Worksheet',
    description: 'Give an existing worksheet a new title.',
    audience: 'human',
    aiMetadata: {
        description:
            'Changes the title of an existing worksheet, identified by its stable sheet id, within a spreadsheet. Use when an agent needs to relabel a tab. Idempotent — re-running with the same new name leaves the title unchanged.',
        idempotent: true,
    },
    props: {
        includeTeamDrives: includeTeamDrivesProp(),
        spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The spreadsheet to work in.'),
        sheetId: sheetIdProp('Worksheet', 'The tab to rename.'),
        newName:Property.ShortText({
            displayName:'New Worksheet Name',
            required:true
        })
    },
    outputSchema: renameWorksheetActionOutputSchema,
    async run(context) {
        const authClient = await createGoogleClient(context.auth);
        const sheets = googleSheets({ version: 'v4', auth: authClient });

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
