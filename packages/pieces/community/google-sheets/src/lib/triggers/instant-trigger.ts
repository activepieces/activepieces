import { PiecePropValueSchema, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { googleSheetsCommon } from "../common/common";
import { googleSheetsAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { v4 as uuid } from 'uuid'
import { columnToLabel } from "../common/common";

export const instantTrigger = createTrigger({
    auth: googleSheetsAuth,
    name: 'instant_trigger',
    displayName: 'Instant trigger',
    description: '',
    props: {
        spreadsheet_id: googleSheetsCommon.spreadsheet_id,
        sheet_id: googleSheetsCommon.sheet_id,

    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const { spreadsheet_id, sheet_id } = context.propsValue;

        // fetch current sheet values
        const currentSheetValues = await getSheetValues(context.auth, spreadsheet_id);

        // store current sheet row count 
        await context.store.put(`${sheet_id}`, currentSheetValues.length);

        const fileNotificationRes = await createFileNotification(context.auth, spreadsheet_id, context.webhookUrl);

        // store channel response
        await context.store.put<WebhookInformation>('instant_trigger', fileNotificationRes.data);
    },
    async onDisable(context) {
        const webhook = await context.store.get<WebhookInformation>(`instant_trigger`);
        if (webhook != null && webhook.id != null && webhook.resourceId != null) {
            const res = await deleteFileNotification(context.auth, webhook.id, webhook.resourceId)
            console.log("DELETING WEBHOOK")
            console.log(res)

        }
    },
    async run(context) {
        // check if notification is a sync message
        if (isSyncMessage(context.payload.headers)) {
            console.log("IT IS SYNC MESSAGE")
            return [];
        }
        if (!isChangeContentMessage(context.payload.headers)) {
            return [];
        }
        const { spreadsheet_id, sheet_id } = context.propsValue;
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)
        const sheets = google.sheets({ version: 'v4', auth: authClient })

        // fetch old row count for sheet 
        const oldRowCount = await context.store.get(`${context.propsValue.sheet_id}`) as number;

        // fetch current row count for sheet
        const currentRowValues = await getSheetValues(context.auth, spreadsheet_id)
        const currentRowCount = currentRowValues.length

        // if no new rows return
        if (oldRowCount === currentRowCount) {
            return [];
        }

        // fetch new rows
        const sheetName = await getSheetName(context.auth, spreadsheet_id, sheet_id);
        if (!sheetName) {
            throw Error(`Sheet with ID ${sheet_id} not found in spreadsheet ${spreadsheet_id}`);
        }

        // create A1 notation range for new rows
        const range = `${sheetName}!${oldRowCount + 1}:${currentRowCount}`

        const newRowValues = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheet_id,
            range: range
        })

        if (newRowValues.data.values === undefined) {
            return []
        }

        // update row count value
        await context.store.put(`${sheet_id}`, currentRowCount)

        // transform row values
        const result = [];
        for (let i = 0; i < (newRowValues.data.values ?? []).length; i++) {
            const values: any = {};
            if (newRowValues.data.values && newRowValues.data.values[i]) {
                for (let j = 0; j < newRowValues.data.values[i].length; j++) {
                    values[columnToLabel(j)] = newRowValues.data.values[i][j]
                }
            }
            result.push({
                row: i + 1,
                values,
            });
        }
        return result;
    },
    sampleData: {},
})

function isSyncMessage(headers: Record<string, string>) {
    return headers['x-goog-resource-state'] === 'sync'
}
function isChangeContentMessage(headers: Record<string, string>) {
    return headers['x-goog-resource-state'] === 'update' && ['content', 'properties', 'content,properties'].includes(headers['x-goog-changed'])
}

async function createFileNotification(auth: PiecePropValueSchema<typeof googleSheetsAuth>, fileId: string, url: string) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    // create unique UUID for channel
    const channelId = uuid();

    return await drive.files.watch({
        fileId: fileId,
        requestBody: {
            id: channelId,
            type: 'web_hook',
            address: url

        }
    })
}
async function deleteFileNotification(auth: PiecePropValueSchema<typeof googleSheetsAuth>, channelId: string, resourceId: string) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const drive = google.drive({ version: 'v3', auth: authClient });
    return await drive.channels.stop({
        requestBody: {
            id: channelId,
            resourceId: resourceId
        }
    })
}

async function getSheetValues(auth: PiecePropValueSchema<typeof googleSheetsAuth>, spreadsheetId: string, range?: string) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    })

    return res.data.values ?? []

}
async function getSheetName(auth: PiecePropValueSchema<typeof googleSheetsAuth>, spreadSheetId: string, sheetId: number) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId });
    const sheetName = res.data.sheets?.find((f) => f.properties?.sheetId == sheetId)?.properties?.title;

    return sheetName;
}

interface WebhookInformation {
    kind?: string | null,
    id?: string | null,
    resourceId?: string | null,
    resourceUri?: string | null,
    expiration?: string | null
}