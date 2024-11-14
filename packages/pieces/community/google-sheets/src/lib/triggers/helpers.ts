import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

import { googleSheetsAuth } from '../..';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { columnToLabel } from '../common/common';

export async function getWorkSheetName(
	auth: PiecePropValueSchema<typeof googleSheetsAuth>,
	spreadSheetId: string,
	sheetId: number,
) {
	const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

	const sheets = google.sheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.get({ spreadsheetId: spreadSheetId });
	const sheetName = res.data.sheets?.find((f) => f.properties?.sheetId == sheetId)?.properties
		?.title;

	if (!sheetName) {
		throw Error(`Sheet with ID ${sheetId} not found in spreadsheet ${spreadSheetId}`);
	}

	return sheetName;
}

export async function getWorkSheetValues(
	auth: PiecePropValueSchema<typeof googleSheetsAuth>,
	spreadsheetId: string,
	range?: string,
) {
	const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

	const sheets = google.sheets({ version: 'v4', auth: authClient });

	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: spreadsheetId,
		range: range,
	});

	return res.data.values ?? [];
}

export async function createFileNotification(
	auth: PiecePropValueSchema<typeof googleSheetsAuth>,
	fileId: string,
	url: string,
	includeTeamDrives?: boolean,
) {
	const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

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
	auth: PiecePropValueSchema<typeof googleSheetsAuth>,
	channelId: string,
	resourceId: string,
) {
	const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

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

export function transformWorkSheetValues(rowValues: any[][], oldRowCount: number) {
	const result = [];
	for (let i = 0; i < rowValues.length; i++) {
		const values: any = {};
		for (let j = 0; j < rowValues[i].length; j++) {
			values[columnToLabel(j)] = rowValues[i][j];
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
