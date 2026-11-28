import { AuthenticationType, httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { isNil, Store, StoreScope } from '@activepieces/pieces-framework';
import { getWorkSheetGridSize } from '../triggers/helpers';
import { getAccessToken, GoogleSheetsAuthValue, googleSheetsCommon, mapRowsToHeaderNames } from './common';

async function readNextRows({
	store,
	auth,
	spreadsheetId,
	sheetId,
	memKey,
	groupSize,
	startRow,
	headerRow,
	useHeaderNames,
	testing,
}: ReadNextRowsParams) {
	try {
		return await walkNextRows({
			store,
			auth,
			spreadsheetId,
			sheetId,
			memKey,
			groupSize,
			startRow,
			headerRow,
			useHeaderNames,
			testing,
		});
	} catch (error) {
		const message = error instanceof HttpError ? vendorMessage(error.response.body) : undefined;
		if (isNil(message)) {
			throw error;
		}
		throw new Error(message);
	}
}

async function walkNextRows({
	store,
	auth,
	spreadsheetId,
	sheetId,
	memKey,
	groupSize,
	startRow,
	headerRow,
	useHeaderNames,
	testing,
}: ReadNextRowsParams) {
	const grid = await getWorkSheetGridSize(auth, spreadsheetId, sheetId);
	const gridRowCount = grid.rowCount ?? 0;
	const configuredStart = startRow || 1;
	const startingRow = await readCursor({ store, memKey, configuredStart });

	if (startingRow > gridRowCount) {
		return [];
	}

	const endRow = Math.min(startingRow + groupSize, gridRowCount + 1);

	const rows = await googleSheetsCommon.getGoogleSheetRows({
		auth,
		sheetId,
		spreadsheetId,
		rowIndex_s: startingRow,
		rowIndex_e: endRow - 1,
		headerRow,
	});

	const finalRows = await mapRowsToHeaderNames(rows, useHeaderNames, spreadsheetId, sheetId, headerRow, auth);

	if (testing) {
		return finalRows;
	}

	if (rows.length > 0) {
		const lastReturnedRow = rows.reduce((highest, row) => Math.max(highest, row.row), startingRow - 1);
		await store.put(memKey, Math.min(endRow, lastReturnedRow + 1), StoreScope.FLOW);
		return finalRows;
	}

	const lastRowWithData = await readLastRowWithData({ auth, spreadsheetId, sheetId });
	const nextCursor =
		startingRow <= lastRowWithData ? endRow : Math.max(lastRowWithData + 1, configuredStart);
	await store.put(memKey, nextCursor, StoreScope.FLOW);
	return finalRows;
}

async function readCursor({
	store,
	memKey,
	configuredStart,
}: {
	store: Store;
	memKey: string;
	configuredStart: number;
}): Promise<number> {
	const memVal = await store.get<unknown>(memKey, StoreScope.FLOW);
	if (isNil(memVal) || memVal === '') {
		return validCursor({ cursor: configuredStart, memVal });
	}
	const cursor = parseInt(String(memVal));
	if (isNaN(cursor)) {
		throw Error(
			'The value stored in memory key : ' + memKey + ' is ' + String(memVal) + ' and it is not a number',
		);
	}
	return validCursor({ cursor, memVal });
}

function validCursor({ cursor, memVal }: { cursor: number; memVal: unknown }): number {
	if (cursor < 1) {
		throw Error('Starting row : ' + cursor + ' is less than 1' + String(memVal));
	}
	return cursor;
}

async function readLastRowWithData({
	auth,
	spreadsheetId,
	sheetId,
}: {
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetId: number;
}): Promise<number> {
	const sheetName = await googleSheetsCommon.findSheetName(auth, spreadsheetId, sheetId);
	const response = await httpClient.sendRequest<{ values?: unknown[][] }>({
		method: HttpMethod.GET,
		url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(
			googleSheetsCommon.sheetRange({ sheetName }),
		)}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: await getAccessToken(auth),
		},
	});
	return response.body.values?.length ?? 0;
}

function vendorMessage(body: unknown): string | undefined {
	if (typeof body !== 'object' || isNil(body) || !('error' in body)) {
		return undefined;
	}
	const vendorError = body.error;
	if (typeof vendorError !== 'object' || isNil(vendorError) || !('message' in vendorError)) {
		return undefined;
	}
	return typeof vendorError.message === 'string' ? vendorError.message : undefined;
}

export const nextRows = {
	readNextRows,
};

type ReadNextRowsParams = {
	store: Store;
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetId: number;
	memKey: string;
	groupSize: number;
	startRow: number;
	headerRow: number;
	useHeaderNames: boolean;
	testing: boolean;
};
