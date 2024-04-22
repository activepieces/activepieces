import { googleSheetsAuth } from '../../';
import { columnToLabel, googleSheetsCommon } from '../common/common';
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

import {
	createTrigger,
	TriggerStrategy,
	DEDUPE_KEY_PROPERTY,
	WebhookRenewStrategy,
} from '@activepieces/pieces-framework';

import crypto from 'crypto';

export const newOrUpdatedRowTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'google-sheets-new-or-updated-row',
	displayName: 'New or Updated Row',
	description: 'Triggers when a new row is added or modified in a spreadsheet.',
	props: {
		spreadsheet_id: googleSheetsCommon.spreadsheet_id,
		sheet_id: googleSheetsCommon.sheet_id,
	},

	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},

	type: TriggerStrategy.WEBHOOK,

	async onEnable(context) {
		const spreadSheetId = context.propsValue.spreadsheet_id;
		const sheetId = context.propsValue.sheet_id;

		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);

		const sheetValues = await getWorkSheetValues(context.auth, spreadSheetId, sheetName);

		const rowHashes = [];

		// create initial row level hashes and used it to check updated row
		for (const row of sheetValues) {
			const rowHash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
			rowHashes.push(rowHash);
		}

		// store compressed values
		await context.store.put(`${sheetId}`, rowHashes);

		// create file watch notification
		const fileNotificationRes = await createFileNotification(
			context.auth,
			spreadSheetId,
			context.webhookUrl,
		);

		await context.store.put<WebhookInformation>(
			'google-sheets-new-or-updated-row',
			fileNotificationRes.data,
		);
	},

	async onDisable(context) {
		const webhook = await context.store.get<WebhookInformation>('google-sheets-new-or-updated-row');

		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
		}
	},

	async run(context) {
		if (isSyncMessage(context.payload.headers)) {
			return [];
		}

		if (!isChangeContentMessage(context.payload.headers)) {
			return [];
		}

		const spreadSheetId = context.propsValue.spreadsheet_id;
		const sheetId = context.propsValue.sheet_id;

		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);

		const oldValuesHashes = (await context.store.get(`${sheetId}`)) as any[];

		// fetch new sheet row values
		const currentValues = await getWorkSheetValues(context.auth, spreadSheetId, sheetName);

		// const rowCount = Math.max(oldValuesHashes.length, currentValues.length);

		const changedValues = [];
		const newRowHashes = [];

		for (let i = 0; i < currentValues.length; i++) {
			const currentRowValue = currentValues[i];

			// create hash for new row values
			const currentRowHash = crypto
				.createHash('md5')
				.update(JSON.stringify(currentRowValue))
				.digest('hex');
			newRowHashes.push(currentRowHash);

			// If row is empty then skip
			if (currentRowValue === undefined || currentRowValue.length === 0) {
				continue;
			}

			const oldRowHash = oldValuesHashes[i];
			if (oldRowHash === undefined || oldRowHash != currentRowHash) {
				const formattedValues: any = {};

				for (let j = 0; j < currentRowValue.length; j++) {
					formattedValues[columnToLabel(j)] = currentRowValue[j];
				}

				changedValues.push({
					row: i + 1,
					values: formattedValues,
				});
			}
		}

		// update the row hashes
		await context.store.put(`${sheetId}`, newRowHashes);

		return changedValues.map((row) => {
			return {
				...row,
				[DEDUPE_KEY_PROPERTY]: hashObject(row),
			};
		});
	},

	async test(context) {
		const spreadSheetId = context.propsValue.spreadsheet_id;
		const sheetId = context.propsValue.sheet_id;

		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadSheetId, sheetName);

		// transform row values
		const transformedRowValues = transformWorkSheetValues(currentSheetValues, 0)
			.slice(-5)
			.reverse();

		return transformedRowValues;
	},

	async onRenew(context) {
		// get current channel ID & resource ID
		const webhook = await context.store.get<WebhookInformation>(`google-sheets-new-or-updated-row`);
		if (webhook != null && webhook.id != null && webhook.resourceId != null) {
			// delete current channel
			await deleteFileNotification(context.auth, webhook.id, webhook.resourceId);
			const fileNotificationRes = await createFileNotification(
				context.auth,
				context.propsValue.spreadsheet_id,
				context.webhookUrl,
			);
			// store channel response
			await context.store.put<WebhookInformation>(
				'google-sheets-new-or-updated-row',
				fileNotificationRes.data,
			);
		}
	},

	sampleData: {},
});
