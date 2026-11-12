import crypto from 'crypto';
import {
	createTrigger,
	DropdownOption,
	isNil,
	Property,
	Store,
	TriggerStrategy,
	WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth, labelToColumn, normalizeColumnLabel } from '../common/common';
import { commonProps } from '../common/props';
import { googleSheetsNewOrUpdatedRowTriggerOutputSchema } from '../output-schemas';
import {
	getWorkSheetName,
	getWorkSheetValues,
	mapRowsToColumnLabels,
	SheetCellValue,
	sheetIdentity,
} from './helpers';
import { LoadedSnapshot, RowChange, rowSnapshot, SnapshotIdentity } from './row-snapshot';
import { rowRun } from './row-run';
import { sheetChannel } from './sheet-channel';

const ALL_COLUMNS = 'all_columns';
const CHANNEL_STORE_KEY = 'google-sheets-new-or-updated-row';
const SNAPSHOT_STORE_KEY = 'google-sheets-new-or-updated-row-snapshot';

function triggerColumnOf(value: string | undefined | null): string {
	if (isNil(value) || value.trim() === '' || value === ALL_COLUMNS) {
		return ALL_COLUMNS;
	}
	return normalizeColumnLabel(value) ?? value;
}

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
	previous,
	current,
	displayValues,
}: {
	store: Store;
	identity: SnapshotIdentity;
	previous: LoadedSnapshot | null;
	current: ReturnType<typeof rowSnapshot.fingerprintRows>;
	displayValues: SheetCellValue[][];
}): Promise<{ indexes: number[]; legacy: boolean; unchanged: boolean; loaded: LoadedSnapshot | null; base: string }> {
	if (!isNil(previous)) {
		const anyColumn = identity.triggerColumn === ALL_COLUMNS;
		const { changes } = rowSnapshot.diffRows({ previous: previous.rows, current });
		return {
			indexes: changes.filter((change) => shouldFire({ change, anyColumn })).map((change) => change.index),
			legacy: false,
			unchanged: rowSnapshot.sameRows({ previous: previous.rows, current }),
			loaded: previous,
			base: previous.comparedWriteId,
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
			loaded: null,
			base: 'legacy',
		};
	}
	console.info('[google-sheets] new_or_updated_row: no row snapshot for these settings, taking a new baseline.');
	return { indexes: [], legacy: false, unchanged: false, loaded: null, base: 'baseline' };
}

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
				'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.\n\nRows that only move (insert, delete, sort) and format-only changes do not fire. With a Trigger Column, a new row fires once that column is filled.',
		}),
		...commonProps,
		trigger_column: Property.Dropdown({
			auth: googleSheetsAuth,
			displayName: 'Trigger Column',
			description:
				'Fire only when this column changes. Any Column fires on any cell.',
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
		const triggerColumn = triggerColumnOf(context.propsValue.trigger_column);
		const triggerColumnIndex = triggerColumnIndexOf(triggerColumn);
		if (!isNil(triggerColumnIndex) && triggerColumnIndex < 0) {
			throw new Error(
				`Trigger Column "${context.propsValue.trigger_column}" is not a column letter. Pick a column from the list, or enter a letter such as A or BC.`,
			);
		}
		const { grid, readAt } = await rowRun.readRows({ auth: context.auth, spreadsheetId, sheetId });

		await rowSnapshot.saveSnapshot({
			store: context.store,
			key: SNAPSHOT_STORE_KEY,
			identity: { spreadsheetId, sheetId, triggerColumn },
			rows: rowSnapshot.fingerprintRows({ rows: grid.raw, triggerColumnIndex }),
			readAt,
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
		const handle = await rowRun.shouldHandleNotification({
			store: context.store,
			channelStoreKey: CHANNEL_STORE_KEY,
			headers: context.payload.headers,
		});
		if (!handle) {
			return [];
		}

		const { spreadsheetId, sheetId } = sheetIdentity(context.propsValue);
		const triggerColumn = triggerColumnOf(context.propsValue.trigger_column);
		const identity: SnapshotIdentity = { spreadsheetId, sheetId, triggerColumn };

		const previous = await rowSnapshot.loadSnapshot({ store: context.store, key: SNAPSHOT_STORE_KEY, identity });
		const { grid, readAt } = await rowRun.readRows({ auth: context.auth, spreadsheetId, sheetId });
		const current = rowSnapshot.fingerprintRows({
			rows: grid.raw,
			triggerColumnIndex: triggerColumnIndexOf(triggerColumn),
		});

		const changed = await findChangedRows({
			store: context.store,
			identity,
			previous,
			current,
			displayValues: grid.display,
		});
		const events = rowRun.labelRows({ display: grid.display, indexes: changed.indexes });

		if (!changed.unchanged) {
			await rowSnapshot.saveSnapshotIfNewer({
				store: context.store,
				key: SNAPSHOT_STORE_KEY,
				identity,
				rows: current,
				loaded: changed.loaded,
				readAt,
			});
		}
		if (changed.legacy) {
			await context.store.delete(legacyStoreKey(sheetId));
		}

		return rowRun.withDedupeKeys({ events, base: changed.base });
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
