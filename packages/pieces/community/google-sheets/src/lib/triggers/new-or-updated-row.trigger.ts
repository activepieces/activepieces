import { isNil } from '@activepieces/shared';
import { googleSheetsAuth } from '../../';
import { areSheetIdsValid, columnToLabel, labelToColumn } from '../common/common';
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
	Property,
	PiecePropValueSchema,
	DropdownOption,
} from '@activepieces/pieces-framework';

import crypto from 'crypto';
import { commonProps } from '../common/props';

const ALL_COLUMNS = 'all_columns';

export const newOrUpdatedRowTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'google-sheets-new-or-updated-row',
	displayName: 'New or Updated Row',
	description: 'Triggers when a new row is added or modified in a spreadsheet.',
	props: {
		info: Property.MarkDown({
			value:
				'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.',
		}),
		...commonProps,
		trigger_column: Property.Dropdown({
			displayName: 'Trigger Column',
			description: `Trigger on changes to cells in this column only.Select **All Columns** if you want the flow to trigger on changes to any cell within the row.`,
			required: false,
			refreshers: ['spreadsheetId', 'sheetId'],
			options: async ({ auth, spreadsheetId, sheetId }) => {
				if (!auth || !spreadsheetId || isNil(sheetId)) {
					return {
						disabled: true,
						options: [],
						placeholder: `Please select sheet first`,
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;
				const spreadsheet_id = spreadsheetId as string;
				const sheet_id = sheetId as number;

				const sheetName = await getWorkSheetName(authValue, spreadsheet_id, sheet_id);

				const firstRowValues = await getWorkSheetValues(
					authValue,
					spreadsheet_id,
					`${sheetName}!1:1`,
				);

				const headers = firstRowValues[0] ?? [];
				const headerCount = headers.length;
				const labeledRowValues = transformWorkSheetValues(firstRowValues, 0, headerCount);

				const options: DropdownOption<string>[] = [{ label: 'All Columns', value: ALL_COLUMNS }];

				Object.entries(labeledRowValues.length > 0 && labeledRowValues[0].values).forEach(([key, value]) => {
					options.push({ label: value as string, value: key });
				});

				return {
					disabled: labeledRowValues.length === 0,
    				options,
    				placeholder: labeledRowValues.length === 0 ? 'No columns found' : undefined,
				};
			},
		}),
	},

	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},

	type: TriggerStrategy.WEBHOOK,

	async onEnable(context) {
		const inputSpreadsheetId = context.propsValue.spreadsheetId;
		const inputSheetId = context.propsValue.sheetId;
		const triggerColumn = context.propsValue.trigger_column ?? ALL_COLUMNS;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
					throw new Error('Please select a spreadsheet and sheet first.');
				}
		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

		const sheetValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);

		const rowHashes = [];

		// create initial row level hashes and used it to check updated row
		for (const row of sheetValues) {
			let targetValue;
			if (triggerColumn === ALL_COLUMNS) {
				targetValue = row;
			} else {
				const currentTriggerColumnValue = row[labelToColumn(triggerColumn)];

				targetValue =
					currentTriggerColumnValue !== undefined && currentTriggerColumnValue !== '' // if column value is empty
						? [currentTriggerColumnValue]
						: [];
			}

			const rowHash = crypto.createHash('md5').update(JSON.stringify(targetValue)).digest('hex');
			rowHashes.push(rowHash);
		}

		// store compressed values
		await context.store.put(`${sheetId}`, rowHashes);

		// create file watch notification
		const fileNotificationRes = await createFileNotification(
			context.auth,
			spreadsheetId,
			context.webhookUrl,
			context.propsValue.includeTeamDrives,
		);

		await context.store.put<WebhookInformation>(
			'google-sheets-new-or-updated-row',
			fileNotificationRes.data,
		);
	},

	async onDisable(context) {
		const webhook = await context.store.get<WebhookInformation>('google-sheets-new-or-updated-row');

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

		const inputSpreadsheetId = context.propsValue.spreadsheetId;
    	const inputSheetId = context.propsValue.sheetId;
		const triggerColumn = context.propsValue.trigger_column ?? ALL_COLUMNS;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

		const oldValuesHashes = (await context.store.get(`${sheetId}`)) as any[];

		/* Fetch rows values with all columns as this will be used on returning updated/new row data
		 */
		const currentValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);

		const headers = currentValues[0] ?? [];
		const headerCount = headers.length;

		// const rowCount = Math.max(oldValuesHashes.length, currentValues.length);

		const changedValues = [];
		const newRowHashes = [];

		for (let row = 0; row < currentValues.length; row++) {
			const currentRowValue = currentValues[row];

			/**
			 * This variable store value based on trigger column.
			 * If trigger column is all_columns then store entry row as target value, else store only column value.
			 */
			let targetValue;
			if (triggerColumn === ALL_COLUMNS) {
				targetValue = currentRowValue;
			} else {
				const currentTriggerColumnValue = currentRowValue[labelToColumn(triggerColumn)];

				targetValue =
					currentTriggerColumnValue !== undefined && currentTriggerColumnValue !== ''
						? [currentTriggerColumnValue]
						: [];
			}

			// create hash for new row values
			const currentRowHash = crypto
				.createHash('md5')
				.update(JSON.stringify(targetValue))
				.digest('hex');
			newRowHashes.push(currentRowHash);

			// If row is empty then skip
			if (currentRowValue === undefined || currentRowValue.length === 0) {
				continue;
			}

			const oldRowHash =
				!isNil(oldValuesHashes) && row < oldValuesHashes.length ? oldValuesHashes[row] : undefined;

			if (oldRowHash === undefined || oldRowHash != currentRowHash) {
				const formattedValues: any = {};

				for (let column = 0; column < headerCount; column++) {
					formattedValues[columnToLabel(column)] = currentValues[row][column] ?? '';
				}

				changedValues.push({
					row: row + 1,
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
		const inputSpreadsheetId = context.propsValue.spreadsheetId;
		const inputSheetId = context.propsValue.sheetId;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    	const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const currentSheetValues = await getWorkSheetValues(context.auth, spreadsheetId, sheetName);

		const headers = currentSheetValues[0] ?? [];
		const headerCount = headers.length;

		// transform row values
		const transformedRowValues = transformWorkSheetValues(currentSheetValues, 0, headerCount)
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
				context.propsValue.spreadsheetId!,
				context.webhookUrl,
				context.propsValue.includeTeamDrives,
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
