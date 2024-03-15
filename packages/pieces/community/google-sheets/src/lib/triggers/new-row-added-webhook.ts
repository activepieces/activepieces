import {
  DEDUPE_KEY_PROPERTY,
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleSheetsAuth } from '../..';
import { columnToLabel, googleSheetsCommon } from '../common/common';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export const newRowAddedTrigger = createTrigger({
  auth: googleSheetsAuth,
  name: 'googlesheets_new_row_added',
  displayName: 'New Row Added',
  description: 'Triggers when a new row is added to bottom of a spreadsheet.',
  props: {
    info: Property.MarkDown({
      value: 'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.'
    }),
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    sheet_id: googleSheetsCommon.sheet_id,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { spreadsheet_id, sheet_id } = context.propsValue;

    // fetch current sheet values
    const sheetName = await getWorkSheetName(
      context.auth,
      spreadsheet_id,
      sheet_id
    );
    const currentSheetValues = await getWorkSheetValues(
      context.auth,
      spreadsheet_id,
      sheetName
    );

    // store current sheet row count
    await context.store.put(`${sheet_id}`, currentSheetValues.length);

    const fileNotificationRes = await createFileNotification(
      context.auth,
      spreadsheet_id,
      context.webhookUrl
    );

    // store channel response
    await context.store.put<WebhookInformation>(
      'googlesheets_new_row_added',
      fileNotificationRes.data
    );
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      `googlesheets_new_row_added`
    );
    if (webhook != null && webhook.id != null && webhook.resourceId != null) {
      await deleteFileNotification(
        context.auth,
        webhook.id,
        webhook.resourceId
      );
    }
  },
  async run(context) {
    // check if notification is a sync message
    if (isSyncMessage(context.payload.headers)) {
      return [];
    }
    if (!isChangeContentMessage(context.payload.headers)) {
      return [];
    }
    const { spreadsheet_id, sheet_id } = context.propsValue;

    // fetch old row count for worksheet
    const oldRowCount = (await context.store.get(
      `${context.propsValue.sheet_id}`
    )) as number;

    // fetch current row count for worksheet
    const sheetName = await getWorkSheetName(
      context.auth,
      spreadsheet_id,
      sheet_id
    );
    const currentRowValues = await getWorkSheetValues(
      context.auth,
      spreadsheet_id,
      sheetName
    );
    const currentRowCount = currentRowValues.length;

    // if no new rows return
    if (oldRowCount === currentRowCount) {
      return [];
    }

    // create A1 notation range for new rows
    const range = `${sheetName}!${oldRowCount + 1}:${currentRowCount}`;

    const newRowValues = await getWorkSheetValues(
      context.auth as PiecePropValueSchema<typeof googleSheetsAuth>,
      spreadsheet_id,
      range
    );

    // update row count value
    await context.store.put(`${sheet_id}`, currentRowCount);

    // transform row values
    const transformedRowValues = transformWorkSheetValues(
      newRowValues,
      oldRowCount
    );
    return transformedRowValues.map((row) => {
      return {
        ...row,
        [DEDUPE_KEY_PROPERTY]: hashObject(row),
      };
    })
  },
  async onRenew(context) {
    // get current channel ID & resource ID
    const webhook = await context.store.get<WebhookInformation>(
      `googlesheets_new_row_added`
    );
    if (webhook != null && webhook.id != null && webhook.resourceId != null) {
      // delete current channel
      await deleteFileNotification(
        context.auth,
        webhook.id,
        webhook.resourceId
      );
      const fileNotificationRes = await createFileNotification(
        context.auth,
        context.propsValue.spreadsheet_id,
        context.webhookUrl
      );
      // store channel response
      await context.store.put<WebhookInformation>(
        'googlesheets_new_row_added',
        fileNotificationRes.data
      );
    }
  },
  async test(context) {
    const { spreadsheet_id, sheet_id } = context.propsValue;
    const sheetName = await getWorkSheetName(
      context.auth,
      spreadsheet_id,
      sheet_id
    );
    const currentSheetValues = await getWorkSheetValues(
      context.auth,
      spreadsheet_id,
      sheetName
    );

    // transform row values
    const transformedRowValues = transformWorkSheetValues(currentSheetValues, 0).slice(-5).reverse();

    return transformedRowValues;
  },
  sampleData: {},
});

function isSyncMessage(headers: Record<string, string>) {
  return headers['x-goog-resource-state'] === 'sync';
}
function isChangeContentMessage(headers: Record<string, string>) {
  // https://developers.google.com/drive/api/guides/push#respond-to-notifications
  return (
    headers['x-goog-resource-state'] === 'update' &&
    ['content', 'properties', 'content,properties'].includes(
      headers['x-goog-changed']
    )
  );
}

async function createFileNotification(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  fileId: string,
  url: string
) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const drive = google.drive({ version: 'v3', auth: authClient });

  // create unique UUID for channel
  const channelId = nanoid();
  return await drive.files.watch({
    fileId: fileId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: url,
    },
  });
}
async function deleteFileNotification(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  channelId: string,
  resourceId: string
) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const drive = google.drive({ version: 'v3', auth: authClient });

  return await drive.channels.stop({
    requestBody: {
      id: channelId,
      resourceId: resourceId,
    },
  });
}

async function getWorkSheetValues(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  spreadsheetId: string,
  range?: string
) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: range,
  });

  return res.data.values ?? [];
}

async function getWorkSheetName(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  spreadSheetId: string,
  sheetId: number
) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId });
  const sheetName = res.data.sheets?.find(
    (f) => f.properties?.sheetId == sheetId
  )?.properties?.title;

  if (!sheetName) {
    throw Error(
      `Sheet with ID ${sheetId} not found in spreadsheet ${spreadSheetId}`
    );
  }
  return sheetName;
}
function transformWorkSheetValues(rowValues: any[][], oldRowCount: number) {
  const result = [];
  for (let i = 0; i < rowValues.length; i++) {
    const values: any = {};
    for (let j = 0; j < rowValues[i].length; j++) {
      values[columnToLabel(j)] = rowValues[i][j];
    }
    result.push({
      row: oldRowCount + i + 1,
      values,
    });
  }
  return result;
}
interface WebhookInformation {
  kind?: string | null;
  id?: string | null;
  resourceId?: string | null;
  resourceUri?: string | null;
  expiration?: string | null;
}

function hashObject(obj: Record<string, unknown>): string {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}