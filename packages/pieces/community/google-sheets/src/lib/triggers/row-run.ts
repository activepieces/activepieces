import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
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
import { rowSnapshot } from './row-snapshot';
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
	events,
	previousByIndex,
}: {
	store: Store;
	storeKey: string;
	events: RowEvent[];
	previousByIndex: Map<number, string>;
}) {
	const keyed = events.map((event) => ({
		...event,
		[DEDUPE_KEY_PROPERTY]: hashObject({
			row: event.row,
			values: event.values,
			previous: previousByIndex.get(event.row - 1) ?? NO_PREVIOUS_ROW,
		}),
	}));
	if (keyed.length === 0) {
		return keyed;
	}
	const now = Date.now();
	const stored = await store.get<unknown>(storeKey);
	const recent = Object.entries(isDeliveredMap(stored) ? stored : {}).filter(
		([, deliveredAt]) => now - deliveredAt < DELIVERED_MEMORY_MS,
	);
	const seen = new Set(recent.map(([key]) => key));
	const fresh = keyed.filter((event) => !seen.has(event[DEDUPE_KEY_PROPERTY]));
	if (fresh.length > 0) {
		const kept = [...recent, ...fresh.map((event): [string, number] => [event[DEDUPE_KEY_PROPERTY], now])].slice(
			-MAX_DELIVERED_KEYS,
		);
		await store.put(storeKey, Object.fromEntries(kept));
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
