import { sheets as googleSheets, sheets_v4 } from '@googleapis/sheets';
import { drive as googleDrive, drive_v3 } from '@googleapis/drive';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { columnToLabel, createGoogleClient, GoogleSheetsAuthValue, googleSheetsCommon } from '../common/common';
import { isNil } from '@activepieces/pieces-framework';

export async function getWorkSheetName(
	auth: GoogleSheetsAuthValue,
	spreadSheetId: string,
	sheetId: number,
) {
	const authClient = await createGoogleClient(auth);

	const sheets = googleSheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId });
	const sheetName = res.data.sheets?.find((f) => f.properties?.sheetId == sheetId)?.properties
		?.title;

	if (!sheetName) {
		throw Error(`Sheet with ID ${sheetId} not found in spreadsheet ${spreadSheetId}`);
	}

	return sheetName;
}

export async function getWorkSheetGridSize(
	auth: GoogleSheetsAuthValue,
	spreadSheetId: string,
	sheetId: number,
) {
	const authClient = await createGoogleClient(auth);

	const sheets = googleSheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId, includeGridData: true, fields: 'sheets.properties(sheetId,title,sheetType,gridProperties)' });
	const sheetRange = res.data.sheets?.find((f) => f.properties?.sheetId == sheetId)?.properties?.gridProperties;

	if (!sheetRange) {
		throw Error(`Unable to get grid size for sheet ${sheetId} in spreadsheet ${spreadSheetId}`);
	}

	return sheetRange
}

export async function getWorkSheetValues({
	auth,
	spreadsheetId,
	sheetName,
	range,
	valueRenderOption = 'FORMATTED_VALUE',
}: {
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetName: string;
	range?: string;
	valueRenderOption?: SheetValueRenderOption;
}): Promise<SheetCellValue[][]> {
	const authClient = await createGoogleClient(auth);

	const sheets = googleSheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: googleSheetsCommon.sheetRange({ sheetName, range }),
		valueRenderOption,
	});

	return res.data.values ?? [];
}

export async function createFileNotification(
	auth: GoogleSheetsAuthValue,
	fileId: string,
	url: string,
	includeTeamDrives?: boolean,
): Promise<{ data: drive_v3.Schema$Channel }> {
	const authClient = await createGoogleClient(auth);

	const drive = googleDrive({ version: 'v3', auth: authClient });

	// create unique UUID for channel
	const channelId = nanoid();
	return await drive.files.watch({
		fileId: fileId,
		supportsAllDrives: includeTeamDrives,
		requestBody: {
			id: channelId,
			expiration: (dayjs().add(6, 'day').unix() * 1000).toString(),
			type: 'web_hook',
			address: url,
		},
	});
}

export async function deleteFileNotification(
	auth: GoogleSheetsAuthValue,
	channelId: string,
	resourceId: string,
): Promise<{ data: void }> {
	const authClient = await createGoogleClient(auth);

	const drive = googleDrive({ version: 'v3', auth: authClient });

	return await drive.channels.stop({
		requestBody: {
			id: channelId,
			resourceId: resourceId,
		},
	});
}

export async function readSheetGrid({
	auth,
	spreadsheetId,
	sheetName,
}: {
	auth: GoogleSheetsAuthValue;
	spreadsheetId: string;
	sheetName: string;
}): Promise<SheetGrid> {
	const authClient = await createGoogleClient(auth);
	const sheets = googleSheets({ version: 'v4', auth: authClient });
	const res = await sheets.spreadsheets.get({
		spreadsheetId,
		ranges: [googleSheetsCommon.sheetRange({ sheetName })],
		includeGridData: true,
		fields: 'sheets(properties(sheetId,title),data(startRow,rowData(values(effectiveValue,formattedValue))))',
	});
	const data = res.data.sheets?.[0]?.data?.[0];
	return sheetGridFromRowData({ rowData: data?.rowData ?? [], startRow: data?.startRow ?? 0 });
}

export function sheetGridFromRowData({
	rowData,
	startRow,
}: {
	rowData: sheets_v4.Schema$RowData[];
	startRow: number;
}): SheetGrid {
	const raw: SheetCellValue[][] = [];
	const display: string[][] = [];
	for (let index = 0; index < startRow; index++) {
		raw.push([]);
		display.push([]);
	}
	for (const row of rowData) {
		const cells = row.values ?? [];
		const rawRow = cells.map((cell) => unformattedValue(cell));
		const displayRow = cells.map((cell) => cell.formattedValue ?? '');
		let end = cells.length;
		while (end > 0 && rawRow[end - 1] === '' && displayRow[end - 1] === '') {
			end -= 1;
		}
		raw.push(rawRow.slice(0, end));
		display.push(displayRow.slice(0, end));
	}
	let rows = raw.length;
	while (rows > 0 && raw[rows - 1].length === 0) {
		rows -= 1;
	}
	return { raw: raw.slice(0, rows), display: display.slice(0, rows) };
}

function unformattedValue(cell: sheets_v4.Schema$CellData): SheetCellValue {
	const value = cell.effectiveValue;
	if (isNil(value)) {
		return '';
	}
	if (!isNil(value.numberValue)) {
		return value.numberValue;
	}
	if (!isNil(value.boolValue)) {
		return value.boolValue;
	}
	if (!isNil(value.stringValue)) {
		return value.stringValue;
	}
	if (!isNil(value.errorValue)) {
		return cell.formattedValue ?? '#ERROR!';
	}
	return '';
}

export function isSyncMessage(headers: Record<string, string>) {
	return headers['x-goog-resource-state'] === 'sync';
}

export function isChangeContentMessage(headers: Record<string, string>) {
	if (headers['x-goog-resource-state'] !== 'update') {
		return false;
	}
	const changed = (headers['x-goog-changed'] ?? '')
		.split(',')
		.map((entry) => entry.trim().toLowerCase());
	return changed.includes('content') || changed.includes('properties');
}

export function hashObject(obj: Record<string, unknown>): string {
	const hash = crypto.createHash('sha256');
	hash.update(JSON.stringify(obj));
	return hash.digest('hex');
}
// returns an array of row number and cells values mapped to column labels
export function mapRowsToColumnLabels(rowValues: any[][], oldRowCount: number, headerCount: number) {
	const result = [];
	for (let i = 0; i < rowValues.length; i++) {
		const values: Record<string, string> = {};
		for (let j = 0; j < Math.max(headerCount, rowValues[i].length); j++) {
			const columnLabel = columnToLabel(j);
			if (isNil(rowValues[i][j])) {
				values[columnLabel] = "";
			} else if (typeof rowValues[i][j] === "string") {
				values[columnLabel] = rowValues[i][j];
			}
			else if ('toString' in rowValues[i][j]) {
				values[columnLabel] = rowValues[i][j].toString();
			}
			else {
				values[columnLabel] = `${rowValues[i][j]}`;
			}
		}
		result.push({
			row: oldRowCount + i + 1,
			values,
		});
	}
	return result;
}

export function sheetIdentity({
	spreadsheetId,
	sheetId,
}: {
	spreadsheetId: string | null | undefined;
	sheetId: string | number | null | undefined;
}): { spreadsheetId: string; sheetId: number } {
	if (isNil(spreadsheetId) || spreadsheetId === '' || isNil(sheetId) || sheetId === '') {
		throw new Error('Please select a spreadsheet and sheet first.');
	}
	return { spreadsheetId, sheetId: Number(sheetId) };
}

export interface WebhookInformation {
	kind?: string | null;
	id?: string | null;
	resourceId?: string | null;
	resourceUri?: string | null;
	expiration?: string | null;
}

export type SheetValueRenderOption = 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE';

export type SheetCellValue = string | number | boolean | null | undefined;

export type SheetGrid = {
	raw: SheetCellValue[][];
	display: string[][];
};
