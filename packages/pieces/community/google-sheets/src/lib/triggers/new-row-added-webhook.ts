import {
	createTrigger,
	DEDUPE_KEY_PROPERTY,
	isNil,
	Property,
	Store,
	TriggerStrategy,
	WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth, GoogleSheetsAuthValue } from '../common/common';
import { commonProps } from '../common/props';
import { googlesheetsNewRowAddedTriggerOutputSchema } from '../output-schemas';
import {
	getWorkSheetName,
	getWorkSheetValues,
	hashObject,
	isChangeContentMessage,
	isSyncMessage,
	mapRowsToColumnLabels,
	sheetIdentity,
} from './helpers';
import { RowFingerprint, rowSnapshot, SnapshotIdentity } from './row-snapshot';
import { sheetChannel } from './sheet-channel';

const CHANNEL_STORE_KEY = 'googlesheets_new_row_added';
const SNAPSHOT_STORE_KEY = 'googlesheets_new_row_added_snapshot';
const NO_TRIGGER_COLUMN = 'first_cell';

function legacyStoreKey(sheetId: number): string {
	return `${sheetId}`;
}

async function findAddedRows({
	store,
	identity,
	current,
}: {
	store: Store;
	identity: SnapshotIdentity;
	current: RowFingerprint[];
}): Promise<{ indexes: number[]; legacy: boolean; unchanged: boolean }> {
	const previous = await rowSnapshot.loadSnapshot({ store, key: SNAPSHOT_STORE_KEY, identity });
	if (!isNil(previous)) {
		const { changes, lastKnownIndex } = rowSnapshot.diffRows({ previous, current, pairMovedRowsByTrigger: true });
		return {
			indexes: changes
				.filter(
					(change) =>
						change.kind === 'new' &&
						change.index > lastKnownIndex &&
						!rowSnapshot.isEmptyRow(change.current),
				)
				.map((change) => change.index),
			legacy: false,
			unchanged: rowSnapshot.sameRows({ previous, current }),
		};
	}
	const legacyRowCount = await store.get<unknown>(legacyStoreKey(identity.sheetId));
	if (typeof legacyRowCount === 'number') {
		return {
			indexes: current
				.map((_row, index) => index)
				.filter((index) => index >= legacyRowCount),
			legacy: true,
			unchanged: false,
		};
	}
	console.info('[google-sheets] new_row_added: no row snapshot for these settings, taking a new baseline.');
	return { indexes: [], legacy: false, unchanged: false };
}

async function readAddedRows({
	auth,
	spreadsheetId,
	sheetName,
	indexes,
	headerCount,
}: {
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetName: string;
	indexes: number[];
	headerCount: number;
}): Promise<{ row: number; values: Record<string, string> }[]> {
	if (indexes.length === 0) {
		return [];
	}
	const first = indexes[0];
	const last = indexes[indexes.length - 1];
	const displayValues = await getWorkSheetValues({
		auth,
		spreadsheetId,
		sheetName,
		range: `${first + 1}:${last + 1}`,
	});
	return indexes.flatMap((index) =>
		mapRowsToColumnLabels([displayValues[index - first] ?? []], index, headerCount),
	);
}

export const newRowAddedTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'googlesheets_new_row_added',
	classification: 'READ',
	displayName: 'New Row Added',
	description: 'Triggers when a new row is added to the bottom of a worksheet.',
	aiMetadata: {
		description:
			'Fires for rows appended below the last row it has already seen in the selected worksheet, emitting one event per new row with its column values. Inserting rows above the bottom, sorting, deleting rows and editing existing rows do not fire this. Delivery may lag up to a few minutes due to Google notification delays.',
	},
	props: {
		info: Property.MarkDown({
			value:
				'Please note that there might be a delay of up to 3 minutes for the trigger to be fired, due to a delay from Google.\n\nOnly rows added below the last row fire. Rows inserted higher up, sorting and edits do not.',
		}),
		...commonProps,
	},
	outputSchema: googlesheetsNewRowAddedTriggerOutputSchema,
	renewConfiguration: {
		strategy: WebhookRenewStrategy.CRON,
		cronExpression: '0 */12 * * *',
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { spreadsheetId, sheetId } = sheetIdentity(context.propsValue);
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
			identity: { spreadsheetId, sheetId, triggerColumn: NO_TRIGGER_COLUMN },
			rows: rowSnapshot.fingerprintRowsByFirstCell({ rows: rawValues }),
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
		const identity: SnapshotIdentity = { spreadsheetId, sheetId, triggerColumn: NO_TRIGGER_COLUMN };

		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);
		const rawValues = await getWorkSheetValues({
			auth: context.auth,
			spreadsheetId,
			sheetName,
			valueRenderOption: 'UNFORMATTED_VALUE',
		});
		const current = rowSnapshot.fingerprintRowsByFirstCell({ rows: rawValues });

		const added = await findAddedRows({ store: context.store, identity, current });
		const events = await readAddedRows({
			auth: context.auth,
			spreadsheetId,
			sheetName,
			indexes: added.indexes,
			headerCount: (rawValues[0] ?? []).length,
		});

		if (!added.unchanged) {
			await rowSnapshot.saveSnapshot({
				store: context.store,
				key: SNAPSHOT_STORE_KEY,
				identity,
				rows: current,
			});
		}
		if (added.legacy) {
			await context.store.delete(legacyStoreKey(sheetId));
		}

		return events.map((row) => ({
			...row,
			[DEDUPE_KEY_PROPERTY]: hashObject(row),
		}));
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
	sampleData: {},
});
