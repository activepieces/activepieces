import {
	DEDUPE_KEY_PROPERTY,
	PiecePropValueSchema,
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
	transformWorkSheetValues,
	WebhookInformation,
} from './helpers';

import { googleSheetsAuth } from '../..';
import { googleSheetsCommon } from '../common/common';

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
		spreadsheet_id: googleSheetsCommon.spreadsheet_id,
		sheet_id: googleSheetsCommon.sheet_id,
		include_team_drives: googleSheetsCommon.include_team_drives,
	},
	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { spreadsheet_id, sheet_id } = context.propsValue;

		// fetch current sheet values
		const sheetName = await getWorkSheetName(context.auth, spreadsheet_id, sheet_id);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadsheet_id, sheetName);

		// store current sheet row count
		await context.store.put(`${sheet_id}`, currentSheetValues.length);

		const fileNotificationRes = await createFileNotification(
			context.auth,
			spreadsheet_id,
			context.webhookUrl,
			context.propsValue.include_team_drives,
		);

		// store channel response
		await context.store.put<WebhookInformation>(
			'googlesheets_new_row_added',
			fileNotificationRes.data,
		);
	},
	async onDisable(context) {
		const webhook = await context.store.get<WebhookInformation>(`googlesheets_new_row_added`);
		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
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
		const oldRowCount = (await context.store.get(`${sheet_id}`)) as number;

		// fetch current row count for worksheet
		const sheetName = await getWorkSheetName(context.auth, spreadsheet_id, sheet_id);
		const currentRowValues = await getWorkSheetValues(context.auth, spreadsheet_id, sheetName);
		const currentRowCount = currentRowValues.length;

		// if no new rows return
		if (oldRowCount >= currentRowCount) {
			if (oldRowCount > currentRowCount) {
				// Some rows were deleted
				await context.store.put(`${sheet_id}`, currentRowCount);
			}
			return [];
		}

		// create A1 notation range for new rows
		const range = `${sheetName}!${oldRowCount + 1}:${currentRowCount}`;

		const newRowValues = await getWorkSheetValues(
			context.auth as PiecePropValueSchema<typeof googleSheetsAuth>,
			spreadsheet_id,
			range,
		);

		// update row count value
		await context.store.put(`${sheet_id}`, currentRowCount);

		// transform row values
		const transformedRowValues = transformWorkSheetValues(newRowValues, oldRowCount);
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
		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			// delete current channel
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
			const fileNotificationRes = await createFileNotification(
				context.auth,
				context.propsValue.spreadsheet_id,
				context.webhookUrl,
				context.propsValue.include_team_drives,
			);
			// store channel response
			await context.store.put<WebhookInformation>(
				'googlesheets_new_row_added',
				fileNotificationRes.data,
			);
		}
	},
	async test(context) {
		const { spreadsheet_id, sheet_id } = context.propsValue;
		const sheetName = await getWorkSheetName(context.auth, spreadsheet_id, sheet_id);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadsheet_id, sheetName);

		// transform row values
		const transformedRowValues = transformWorkSheetValues(currentSheetValues, 0)
			.slice(-5)
			.reverse();

		return transformedRowValues;
	},
	sampleData: {},
});
