import { DEDUPE_KEY_PROPERTY, Store, tryCatch } from '@activepieces/pieces-framework';
import { GoogleSheetsAuthValue } from '../common/common';
import {
	getWorkSheetName,
	hashObject,
	isChangeContentMessage,
	isSyncMessage,
	mapRowsToColumnLabels,
	readSheetGrid,
	SheetGrid,
} from './helpers';
import { rowSnapshot, SnapshotIdentity } from './row-snapshot';
import { sheetChannel } from './sheet-channel';

async function shouldHandleNotification({
	store,
	channelStoreKey,
	headers,
}: {
	store: Store;
	channelStoreKey: string;
	headers: Record<string, string>;
}): Promise<boolean> {
	if (!isSyncMessage(headers) && !isChangeContentMessage(headers)) {
		return false;
	}
	const foreign = await sheetChannel.isForeignNotification({ store, storeKey: channelStoreKey, headers });
	return !foreign;
}

async function readRows({
	auth,
	spreadsheetId,
	sheetId,
}: {
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetId: number;
}): Promise<{ grid: SheetGrid; readAt: number }> {
	const sheetName = await getWorkSheetName(auth, spreadsheetId, sheetId);
	const readAt = rowSnapshot.readTimestamp();
	const grid = await readSheetGrid({ auth, spreadsheetId, sheetName });
	return { grid, readAt };
}

function labelRows({ display, indexes }: { display: string[][]; indexes: number[] }): RowEvent[] {
	const headerCount = (display[0] ?? []).length;
	return indexes.flatMap((index) => mapRowsToColumnLabels([display[index] ?? []], index, headerCount));
}

async function deliverOnce({
	store,
	storeKey,
	identity,
	events,
	previousByIndex,
}: {
	store: Store;
	storeKey: string;
	identity: SnapshotIdentity;
	events: RowEvent[];
	previousByIndex: Map<number, string>;
}) {
	const keyed = events.map((event) => ({
		...event,
		[DEDUPE_KEY_PROPERTY]: hashObject({
			spreadsheetId: identity.spreadsheetId,
			sheetId: identity.sheetId,
			triggerColumn: identity.triggerColumn,
			row: event.row,
			values: event.values,
			previous: previousByIndex.get(event.row - 1) ?? NO_PREVIOUS_ROW,
		}),
	}));
	if (keyed.length === 0) {
		return keyed;
	}
	const now = Date.now();
	const stored = await tryCatch(() => store.get<unknown>(storeKey));
	if (stored.error) {
		console.warn('[google-sheets] could not read recently delivered rows; relying on the 30 s dedupe window.', stored.error);
		return keyed;
	}
	const recent = Object.entries(isDeliveredMap(stored.data) ? stored.data : {}).filter(
		([, deliveredAt]) => now - deliveredAt < DELIVERED_MEMORY_MS,
	);
	const seen = new Set(recent.map(([key]) => key));
	const fresh = keyed.filter((event) => !seen.has(event[DEDUPE_KEY_PROPERTY]));
	if (fresh.length > 0) {
		const kept = [...recent, ...fresh.map((event): [string, number] => [event[DEDUPE_KEY_PROPERTY], now])].slice(
			-MAX_DELIVERED_KEYS,
		);
		const saved = await tryCatch(() => store.put(storeKey, Object.fromEntries(kept)));
		if (saved.error) {
			console.warn('[google-sheets] could not remember delivered rows; a later overlapping run may deliver them again.', saved.error);
		}
	}
	return fresh;
}

function isDeliveredMap(value: unknown): value is Record<string, number> {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value).every((entry) => typeof entry === 'number')
	);
}

export const rowRun = {
	shouldHandleNotification,
	readRows,
	labelRows,
	deliverOnce,
};

const DELIVERED_MEMORY_MS = 10 * 60 * 1000;
const MAX_DELIVERED_KEYS = 2000;
const NO_PREVIOUS_ROW = 'none';

export type RowEvent = { row: number; values: Record<string, string> };
