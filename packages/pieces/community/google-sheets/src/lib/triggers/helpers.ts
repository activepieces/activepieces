import { google } from 'googleapis';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { columnToLabel, createGoogleClient, GoogleSheetsAuthValue } from '../common/common';
import { isNil } from '@activepieces/shared';

export async function getWorkSheetName(
	auth: GoogleSheetsAuthValue,
	spreadSheetId: string,
	sheetId: number,
) {
	const authClient = await createGoogleClient(auth);

	const sheets = google.sheets({ version: 'v4', auth: authClient });

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

	const sheets = google.sheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId, includeGridData: true, fields: 'sheets.properties(sheetId,title,sheetType,gridProperties)' });
	const sheetRange = res.data.sheets?.find((f) => f.properties?.sheetId == sheetId)?.properties?.gridProperties;

	if (!sheetRange) {
		throw Error(`Unable to get grid size for sheet ${sheetId} in spreadsheet ${spreadSheetId}`);
	}

	return sheetRange
}

export async function getWorkSheetValues(
	auth: GoogleSheetsAuthValue,
	spreadsheetId: string,
	range?: string,
) {
	const authClient = await createGoogleClient(auth);

	const sheets = google.sheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: range,
	});

	return res.data.values ?? [];
}

export async function createFileNotification(
	auth: GoogleSheetsAuthValue,
	fileId: string,
	url: string,
	includeTeamDrives?: boolean,
) {
	const authClient = await createGoogleClient(auth);

	const drive = google.drive({ version: 'v3', auth: authClient });

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
) {
	const authClient = await createGoogleClient(auth);

	const drive = google.drive({ version: 'v3', auth: authClient });

	return await drive.channels.stop({
		requestBody: {
			id: channelId,
			resourceId: resourceId,
		},
	});
}

export function isSyncMessage(headers: Record<string, string>) {
	return headers['x-goog-resource-state'] === 'sync';
}

export function isChangeContentMessage(headers: Record<string, string>) {
	// https://developers.google.com/drive/api/guides/push#respond-to-notifications
	return (
		headers['x-goog-resource-state'] === 'update' &&
		['content', 'properties', 'content,properties'].includes(headers['x-goog-changed'])
	);
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

export interface WebhookInformation {
	kind?: string | null;
	id?: string | null;
	resourceId?: string | null;
	resourceUri?: string | null;
	expiration?: string | null;
}
