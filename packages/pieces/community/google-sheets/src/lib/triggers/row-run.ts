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

function withDedupeKeys({ events, base }: { events: RowEvent[]; base: string }) {
	return events.map((event) => ({
		...event,
		[DEDUPE_KEY_PROPERTY]: hashObject({ base, row: event.row, values: event.values }),
	}));
}

export const rowRun = {
	shouldHandleNotification,
	readRows,
	labelRows,
	withDedupeKeys,
};

export type RowEvent = { row: number; values: Record<string, string> };
