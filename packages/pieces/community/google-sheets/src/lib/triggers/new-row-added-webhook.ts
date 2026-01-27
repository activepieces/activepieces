import {
	DEDUPE_KEY_PROPERTY,
	Property,
	TriggerStrategy,
	WebhookRenewStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import {
	createFileNotification,
	deleteFileNotification,
	getWorkSheetName,
	getWorkSheetValues,
	hashObject,
	isChangeContentMessage,
	isSyncMessage,
	mapRowsToColumnLabels,
	WebhookInformation,
} from './helpers';

import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';
import { areSheetIdsValid,  } from '../common/common';

export const newRowAddedTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'googlesheets_new_row_added',
	displayName: 'New Row Added',
	description: 'Triggers when a new row is added to bottom of a spreadsheet.',
	props: {
		info: Property.MarkDown({
			value:
				'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.',
		}),
		...commonProps,
	},
	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { spreadsheetId:inputSpreadsheetId, sheetId:inputSheetId } = context.propsValue;

		 if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
					throw new Error('Please select a spreadsheet and sheet first.');
				}
		
		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);

		await context.store.put(`${sheetId}`, currentSheetValues.length);

		const fileNotificationRes = await createFileNotification(
			context.auth,
			spreadsheetId,
			context.webhookUrl,
			context.propsValue.includeTeamDrives,
		);

		await context.store.put<WebhookInformation>(
			'googlesheets_new_row_added',
			fileNotificationRes.data,
		);
	},
	async onDisable(context) {
		const webhook = await context.store.get<WebhookInformation>(`googlesheets_new_row_added`);
		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			try
			{
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
			}
			catch(err){
  				console.debug("deleteFileNotification failed :",JSON.stringify(err));
			}
		}
	},
	async run(context) {
		if (isSyncMessage(context.payload.headers)) {
			return [];
		}
		if (!isChangeContentMessage(context.payload.headers)) {
			return [];
		}

		const { spreadsheetId:inputSpreadsheetId, sheetId:inputSheetId } = context.propsValue;

		 if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
					throw new Error('Please select a spreadsheet and sheet first.');
				}
		
		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const oldRowCount = (await context.store.get(`${sheetId}`)) as number;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const currentRowValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);
		const currentRowCount = currentRowValues.length;

		const headers =  currentRowValues[0] ?? [];
		const headerCount = headers.length;

		if (oldRowCount >= currentRowCount) {
			if (oldRowCount > currentRowCount) {
				await context.store.put(`${sheetId}`, currentRowCount);
			}
			return [];
		}

		// create A1 notation range for new rows
		const range = `${sheetName}!${oldRowCount + 1}:${currentRowCount}`;

		const newRowValues = await getWorkSheetValues(
			context.auth,
			spreadsheetId,
			range,
		);

		await context.store.put(`${sheetId}`, currentRowCount);

		const transformedRowValues = mapRowsToColumnLabels(newRowValues, oldRowCount,headerCount);
		return transformedRowValues.map((row) => {
			return {
				...row,
				[DEDUPE_KEY_PROPERTY]: hashObject(row),
			};
		});
	},
	async onRenew(context) {
		// get current channel ID & resource ID
		const webhook = await context.store.get<WebhookInformation>(`googlesheets_new_row_added`);

		const { spreadsheetId:inputSpreadsheetId, sheetId:inputSheetId } = context.propsValue;

		 if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
					throw new Error('Please select a spreadsheet and sheet first.');
				}
		
		const spreadsheetId = inputSpreadsheetId as string;

		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
			const fileNotificationRes = await createFileNotification(
				context.auth,
				spreadsheetId,
				context.webhookUrl,
				context.propsValue.includeTeamDrives,
			);
			await context.store.put<WebhookInformation>(
				'googlesheets_new_row_added',
				fileNotificationRes.data,
			);
		}
	},
	async test(context) {
		const { spreadsheetId:inputSpreadsheetId, sheetId:inputSheetId } = context.propsValue;

		 if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
					throw new Error('Please select a spreadsheet and sheet first.');
				}
		
		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;
		
		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);

		const headers =  currentSheetValues[0] ?? [];
		const headerCount = headers.length;

		const transformedRowValues = mapRowsToColumnLabels(currentSheetValues, 0,headerCount)
			.slice(-5)
			.reverse();

		return transformedRowValues;
	},
	sampleData: {},
});
