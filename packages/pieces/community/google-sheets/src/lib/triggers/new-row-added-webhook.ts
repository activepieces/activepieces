import {
	createTrigger,
	isNil,
	Property,
	Store,
	TriggerStrategy,
	WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import { googleSheetsAuth } from '../common/common';
import { commonProps } from '../common/props';
import { googlesheetsNewRowAddedTriggerOutputSchema } from '../output-schemas';
import { getWorkSheetName, getWorkSheetValues, mapRowsToColumnLabels, sheetIdentity } from './helpers';
import { LoadedSnapshot, RowFingerprint, rowSnapshot, SnapshotIdentity } from './row-snapshot';
import { rowRun } from './row-run';
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
	previous,
	current,
}: {
	store: Store;
	identity: SnapshotIdentity;
	previous: LoadedSnapshot | null;
	current: RowFingerprint[];
}): Promise<{ indexes: number[]; legacy: boolean; unchanged: boolean; loaded: LoadedSnapshot | null; base: string }> {
	if (!isNil(previous)) {
		const { changes, lastKnownIndex } = rowSnapshot.diffRows({
			previous: previous.rows,
			current,
			pairMovedRowsByTrigger: true,
		});
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
			unchanged: rowSnapshot.sameRows({ previous: previous.rows, current }),
			loaded: previous,
			base: previous.comparedWriteId,
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
			loaded: null,
			base: `legacy-${legacyRowCount}`,
		};
	}
	console.info('[google-sheets] new_row_added: no row snapshot for these settings, taking a new baseline.');
	return { indexes: [], legacy: false, unchanged: false, loaded: null, base: 'baseline' };
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
		const { grid, readAt } = await rowRun.readRows({ auth: context.auth, spreadsheetId, sheetId });

		await rowSnapshot.saveSnapshot({
			store: context.store,
			key: SNAPSHOT_STORE_KEY,
			identity: { spreadsheetId, sheetId, triggerColumn: NO_TRIGGER_COLUMN },
			rows: rowSnapshot.fingerprintRowsByFirstCell({ rows: grid.raw }),
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
		const identity: SnapshotIdentity = { spreadsheetId, sheetId, triggerColumn: NO_TRIGGER_COLUMN };

		const previous = await rowSnapshot.loadSnapshot({ store: context.store, key: SNAPSHOT_STORE_KEY, identity });
		const { grid, readAt } = await rowRun.readRows({ auth: context.auth, spreadsheetId, sheetId });
		const current = rowSnapshot.fingerprintRowsByFirstCell({ rows: grid.raw });

		const added = await findAddedRows({ store: context.store, identity, previous, current });
		const events = rowRun.labelRows({ display: grid.display, indexes: added.indexes });

		if (!added.unchanged) {
			await rowSnapshot.saveSnapshotIfNewer({
				store: context.store,
				key: SNAPSHOT_STORE_KEY,
				identity,
				rows: current,
				loaded: added.loaded,
				readAt,
			});
		}
		if (added.legacy) {
			await context.store.delete(legacyStoreKey(sheetId));
		}

		return rowRun.withDedupeKeys({ events, base: added.base });
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
