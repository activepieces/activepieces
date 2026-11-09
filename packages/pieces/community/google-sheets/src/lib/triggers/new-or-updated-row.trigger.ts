import crypto from 'crypto';
import {
	createTrigger,
	DEDUPE_KEY_PROPERTY,
	DropdownOption,
	isNil,
	Property,
	Store,
	TriggerStrategy,
	WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth, labelToColumn } from '../common/common';
import { commonProps } from '../common/props';
import { googleSheetsNewOrUpdatedRowTriggerOutputSchema } from '../output-schemas';
import {
	getWorkSheetName,
	getWorkSheetValues,
	hashObject,
	isChangeContentMessage,
	isSyncMessage,
	labelRowValues,
	mapRowsToColumnLabels,
	SheetCellValue,
	sheetIdentity,
} from './helpers';
import { RowChange, rowSnapshot, SnapshotIdentity } from './row-snapshot';
import { sheetChannel } from './sheet-channel';

const ALL_COLUMNS = 'all_columns';
const CHANNEL_STORE_KEY = 'google-sheets-new-or-updated-row';
const SNAPSHOT_STORE_KEY = 'google-sheets-new-or-updated-row-snapshot';

export const newOrUpdatedRowTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'google-sheets-new-or-updated-row',
	classification: 'READ',
	displayName: 'New or Updated Row',
	description: 'Triggers when a new row is added or modified in a spreadsheet.',
	aiMetadata: {
		description:
			'Fires when a row in the selected worksheet is added or any of its cell values change; can be narrowed to watch a single trigger column. Each event represents one new or changed row with its current values. Moving rows (insert, delete, sort) and format-only changes do not fire; a row whose cells are all cleared fires once with blank values, unless it is the last row of data (that reads as a deletion and does not fire); inserting a copy of an existing row fires once. With a trigger column, a new row fires once that column is filled. Delivery may lag up to a few minutes due to Google notification delays.',
	},
	props: {
		info: Property.MarkDown({
			value:
				'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.\n\nRows that only move (insert, delete, sort) and format-only changes do not fire.',
		}),
		...commonProps,
		trigger_column: Property.Dropdown({
			auth: googleSheetsAuth,
			displayName: 'Trigger Column',
			description:
				'Fire only when this column changes. A new row fires once this column is filled. Any Column fires on any cell.',
			required: false,
			refreshers: ['spreadsheetId', 'sheetId'],
			defaultValue: ALL_COLUMNS,
			options: async ({ auth, spreadsheetId, sheetId }) => {
				if (!auth || !spreadsheetId || isNil(sheetId)) {
					return {
						disabled: true,
						options: [],
						placeholder: `Select a worksheet first`,
					};
				}

				const spreadsheet_id = spreadsheetId as string;
				const sheet_id = sheetId as number;

				const sheetName = await getWorkSheetName(auth, spreadsheet_id, sheet_id);

				const firstRowValues = await getWorkSheetValues({
					auth,
					spreadsheetId: spreadsheet_id,
					sheetName,
					range: '1:1',
				});

				const headers = firstRowValues[0] ?? [];
				const headerCount = headers.length;
				const labeledRowValues = mapRowsToColumnLabels(firstRowValues, 0, headerCount);
				const labledHeaders = labeledRowValues.length > 0 ? labeledRowValues[0].values : {};

				const options = Object.entries(labledHeaders).reduce(
					(accumlator: DropdownOption<string>[], [key, value]) => {
						accumlator.push({ label: value, value: key });
						return accumlator;
					},
					[{ label: 'Any Column', value: ALL_COLUMNS }],
				);

				return {
					disabled: options.length === 0,
					options,
				};
			},
		}),
	},
	outputSchema: googleSheetsNewOrUpdatedRowTriggerOutputSchema,

	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},

	type: TriggerStrategy.WEBHOOK,

	async onEnable(context) {
		const { spreadsheetId, sheetId } = sheetIdentity(context.propsValue);
		const triggerColumn = context.propsValue.trigger_column ?? ALL_COLUMNS;
		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const rawValues = await getWorkSheetValues({
			auth: context.auth,
			spreadsheetId,
			sheetName,
			valueRenderOption: 'UNFORMATTED_VALUE',
		});

		await rowSnapshot.saveSnapshot({
			store: context.store,
			key: SNAPSHOT_STORE_KEY,
			identity: { spreadsheetId, sheetId, triggerColumn },
			rows: rowSnapshot.fingerprintRows({
				rows: rawValues,
				triggerColumnIndex: triggerColumnIndexOf(triggerColumn),
			}),
		});
		await context.store.delete(legacyStoreKey(sheetId));

		await sheetChannel.openChannel({
			auth: context.auth,
			store: context.store,
			storeKey: CHANNEL_STORE_KEY,
			spreadsheetId,
			webhookUrl: context.webhookUrl,
			includeTeamDrives: context.propsValue.includeTeamDrives,
		});
	},

	async onDisable(context) {
		await sheetChannel.closeChannel({
			auth: context.auth,
			store: context.store,
			storeKey: CHANNEL_STORE_KEY,
		});
	},

	async run(context) {
		const headers = context.payload.headers;
		if (isSyncMessage(headers) || !isChangeContentMessage(headers)) {
			return [];
		}
		if (
			await sheetChannel.isForeignNotification({
				store: context.store,
				storeKey: CHANNEL_STORE_KEY,
				headers,
			})
		) {
			return [];
		}

		const { spreadsheetId, sheetId } = sheetIdentity(context.propsValue);
		const triggerColumn = context.propsValue.trigger_column ?? ALL_COLUMNS;
		const identity: SnapshotIdentity = { spreadsheetId, sheetId, triggerColumn };

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const displayValues = await getWorkSheetValues({
			auth: context.auth,
			spreadsheetId,
			sheetName,
			valueRenderOption: 'FORMATTED_VALUE',
		});
		const rawValues = await getWorkSheetValues({
			auth: context.auth,
			spreadsheetId,
			sheetName,
			valueRenderOption: 'UNFORMATTED_VALUE',
		});
		const current = rowSnapshot.fingerprintRows({
			rows: rawValues,
			triggerColumnIndex: triggerColumnIndexOf(triggerColumn),
		});

		const changedIndexes = await findChangedRows({
			store: context.store,
			identity,
			current,
			displayValues,
		});

		if (!changedIndexes.unchanged) {
			await rowSnapshot.saveSnapshot({
				store: context.store,
				key: SNAPSHOT_STORE_KEY,
				identity,
				rows: current,
			});
		}
		if (changedIndexes.legacy) {
			await context.store.delete(legacyStoreKey(sheetId));
		}

		const headerCount = (displayValues[0] ?? []).length;
		return changedIndexes.indexes.map((index) => {
			const row = {
				row: index + 1,
				values: labelRowValues({ row: displayValues[index], headerCount }),
			};
			return {
				...row,
				[DEDUPE_KEY_PROPERTY]: hashObject(row),
			};
		});
	},

	async test(context) {
		const { spreadsheetId, sheetId } = sheetIdentity(context.propsValue);
		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const currentSheetValues = await getWorkSheetValues({
			auth: context.auth,
			spreadsheetId,
			sheetName,
		});

		const headerCount = (currentSheetValues[0] ?? []).length;

		return mapRowsToColumnLabels(currentSheetValues, 0, headerCount).slice(1).slice(-5).reverse();
	},

	async onRenew(context) {
		const { spreadsheetId } = sheetIdentity(context.propsValue);
		await sheetChannel.openChannel({
			auth: context.auth,
			store: context.store,
			storeKey: CHANNEL_STORE_KEY,
			spreadsheetId,
			webhookUrl: context.webhookUrl,
			includeTeamDrives: context.propsValue.includeTeamDrives,
		});
	},

	sampleData: {},
});

function triggerColumnIndexOf(triggerColumn: string): number | undefined {
	return triggerColumn === ALL_COLUMNS ? undefined : labelToColumn(triggerColumn);
}

function legacyStoreKey(sheetId: number): string {
	return `${sheetId}`;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function shouldFire({ change, anyColumn }: { change: RowChange; anyColumn: boolean }): boolean {
	if (change.kind === 'edited') {
		const previous = change.previous;
		if (isNil(previous)) {
			return false;
		}
		return anyColumn ? previous.full !== change.current.full : previous.trigger !== change.current.trigger;
	}
	if (rowSnapshot.isEmptyRow(change.current)) {
		return false;
	}
	return anyColumn || !rowSnapshot.hasBlankTrigger(change.current);
}

function legacyChangedRows({
	displayValues,
	legacyHashes,
	triggerColumn,
}: {
	displayValues: SheetCellValue[][];
	legacyHashes: string[];
	triggerColumn: string;
}): number[] {
	return displayValues.flatMap((row, index) => {
		if (isNil(row) || row.length === 0) {
			return [];
		}
		const watched = triggerColumn === ALL_COLUMNS ? undefined : row[labelToColumn(triggerColumn)];
		const target =
			triggerColumn === ALL_COLUMNS ? row : !isNil(watched) && watched !== '' ? [watched] : [];
		const hash = crypto.createHash('md5').update(JSON.stringify(target)).digest('hex');
		const previous = legacyHashes[index];
		return isNil(previous) || previous !== hash ? [index] : [];
	});
}

async function findChangedRows({
	store,
	identity,
	current,
	displayValues,
}: {
	store: Store;
	identity: SnapshotIdentity;
	current: ReturnType<typeof rowSnapshot.fingerprintRows>;
	displayValues: SheetCellValue[][];
}): Promise<{ indexes: number[]; legacy: boolean; unchanged: boolean }> {
	const previous = await rowSnapshot.loadSnapshot({ store, key: SNAPSHOT_STORE_KEY, identity });
	if (!isNil(previous)) {
		const anyColumn = identity.triggerColumn === ALL_COLUMNS;
		const { changes } = rowSnapshot.diffRows({ previous, current });
		return {
			indexes: changes.filter((change) => shouldFire({ change, anyColumn })).map((change) => change.index),
			legacy: false,
			unchanged: rowSnapshot.sameRows({ previous, current }),
		};
	}
	const legacyHashes = await store.get<unknown>(legacyStoreKey(identity.sheetId));
	if (isStringArray(legacyHashes)) {
		return {
			indexes: legacyChangedRows({
				displayValues,
				legacyHashes,
				triggerColumn: identity.triggerColumn,
			}),
			legacy: true,
			unchanged: false,
		};
	}
	console.info('[google-sheets] new_or_updated_row: no row snapshot for these settings, taking a new baseline.');
	return { indexes: [], legacy: false, unchanged: false };
}
