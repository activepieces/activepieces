import { googleSheetsAuth } from '../../index';
import { createTrigger,Property,PiecePropValueSchema,TriggerStrategy } from '@activepieces/pieces-framework';

import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleSheetsCommon } from '../common/common';
import { isNil } from '@activepieces/shared';

export const newWorksheetTrigger = createTrigger({
    auth: googleSheetsAuth,
    name: 'new-worksheet',
    displayName: 'New Worksheet',
    description: 'Triggers when a worksheet is created in a spreadsheet.',
    type: TriggerStrategy.POLLING,
    props: {
        include_team_drives: googleSheetsCommon.include_team_drives,
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    },
    async onEnable(context) {
        const ids: number[] = [];
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.get({
            spreadsheetId: context.propsValue.spreadsheet_id,
        });
        if (response.data.sheets) {
            for (const sheet of response.data.sheets) {
                const sheetId = sheet.properties?.sheetId;
                if (sheetId) {
                    ids.push(sheetId);
                }
            }
        }
        await context.store.put('worksheets', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('worksheets');
    },
    async test(context) {
        const worksheets = [];
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.get({
            spreadsheetId: context.propsValue.spreadsheet_id,
        });
        console.log(JSON.stringify(response.data.sheets, null, 2), '\n');
        if (response.data.sheets) {
            for (const sheet of response.data.sheets) {
                worksheets.push(sheet);
            }
        }
        console.log(JSON.stringify(worksheets, null, 2), '\n');
        return worksheets;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('worksheets')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];
        console.log("Existing\n")
        console.log(JSON.stringify(parsedExistingIds, null, 2), '\n');
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.get({
            spreadsheetId: context.propsValue.spreadsheet_id,
        });
        console.log(JSON.stringify(response.data.sheets, null, 2), '\n');
        if (isNil(response.data.sheets) || response.data.sheets.length === 0) {
            return [];
        }
        // Filter valid worksheetss
        const newWorksheets = response.data.sheets.filter(
            (sheet) => !parsedExistingIds.includes(sheet.properties?.sheetId!),
        );
        console.log("New\n")
        console.log(JSON.stringify(newWorksheets, null, 2), '\n');
        const newIds = newWorksheets.map((sheet) => sheet.properties?.sheetId!);
        console.log("New\n")
        console.log(JSON.stringify(newIds, null, 2), '\n');
        if (newIds.length === 0) {
            return [];
        }
        // Store new IDs
        await context.store.put('worksheets', JSON.stringify([...newIds, ...parsedExistingIds]));
        return newWorksheets;
    },
    sampleData: {
        properties: {
            sheetId: 2077270595,
            title: 'Sheet5',
            index: 1,
            sheetType: 'GRID',
            gridProperties: {
                rowCount: 1000,
                columnCount: 26,
            },
        },
    },
});