import { googleSheetsAuth } from '../../index';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { columnToLabel, getHeaderRow, googleSheetsCommon } from './common';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const includeTeamDrivesProp = () =>
	Property.Checkbox({
		displayName: 'Include Team Drive Sheets ?',
		description: 'Determines if sheets from Team Drives should be included in the results.',
		defaultValue: false,
		required: false,
	});

export const spreadsheetIdProp = (displayName: string, description: string, required = true) =>
	Property.Dropdown({
		displayName,
		description,
		required,
		refreshers: ['includeTeamDrives'],
		options: async ({ auth, includeTeamDrives }, { searchValue }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please authenticate first',
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;

			const authClient = new OAuth2Client();
			authClient.setCredentials(authValue);

			const drive = google.drive({ version: 'v3', auth: authClient });

			const q = ["mimeType='application/vnd.google-apps.spreadsheet'", 'trashed = false'];

			if (searchValue) {
				q.push(`name contains '${searchValue}'`);
			}

			let nextPageToken;
			const options: DropdownOption<string>[] = [];
			do {
				const response: any = await drive.files.list({
					q: q.join(' and '),
					pageToken: nextPageToken,
					orderBy: 'createdTime desc',
					fields: 'nextPageToken, files(id, name)',
					supportsAllDrives: true,
					includeItemsFromAllDrives: includeTeamDrives ? true : false,
				});
				const fileList: drive_v3.Schema$FileList = response.data;

				if (fileList.files) {
					for (const file of fileList.files) {
						options.push({
							label: file.name!,
							value: file.id!,
						});
					}
				}
				nextPageToken = response.data.nextPageToken;
			} while (nextPageToken);

			return {
				disabled: false,
				options,
			};
		},
	});

export const sheetIdProp = (displayName: string, description: string, required = true) =>
	Property.Dropdown({
		displayName,
		description,
		required,
		refreshers: ['spreadsheetId'],
		options: async ({ auth, spreadsheetId }) => {
			if (!auth || (spreadsheetId ?? '').toString().length === 0) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select a spreadsheet first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;

			const authClient = new OAuth2Client();
			authClient.setCredentials(authValue);

			const sheets = google.sheets({ version: 'v4', auth: authClient });

			const response = await sheets.spreadsheets.get({
				spreadsheetId: spreadsheetId as unknown as string,
			});

			const sheetsData = response.data.sheets ?? [];

			const options: DropdownOption<number>[] = [];

			for (const sheet of sheetsData) {
				const title = sheet.properties?.title;
				const sheetId = sheet.properties?.sheetId;
				if(isNil(title) || isNil(sheetId)){
					continue;
				}
				options.push({
					label: title,
					value: sheetId,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const commonProps = {
	includeTeamDrives: includeTeamDrivesProp(),
	spreadsheetId: spreadsheetIdProp('Spreadsheet', 'The ID of the spreadsheet to use.'),
	sheetId: sheetIdProp('Sheet', 'The ID of the sheet to use.'),
};

export const rowValuesProp = () =>
	Property.DynamicProperties({
		displayName: 'Values',
		description: 'The values to insert',
		required: true,
		refreshers: ['sheetId', 'spreadsheetId', 'first_row_headers'],
		props: async ({ auth, spreadsheetId, sheetId, first_row_headers }) => {
			if (
				!auth ||
				(spreadsheetId ?? '').toString().length === 0 ||
				(sheetId ?? '').toString().length === 0
			) {
				return {};
			}
			const sheet_id = Number(sheetId);
			const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;

			const headers = await googleSheetsCommon.getHeaderRow({
				spreadsheetId: spreadsheetId as unknown as string,
				accessToken: getAccessTokenOrThrow(authValue),
				sheetId: sheet_id,
			});

			if (!first_row_headers) {
				return {
					values: Property.Array({
						displayName: 'Values',
						required: true,
					}),
				};
			}
			const firstRow = headers ?? [];
			const properties: {
				[key: string]: any;
			} = {};

			for (let i = 0; i < firstRow.length; i++) {
				const label = columnToLabel(i);
				properties[label] = Property.ShortText({
					displayName: firstRow[i].toString(),
					description: firstRow[i].toString(),
					required: false,
					defaultValue: '',
				});
			}
			return properties;
		},
	});

export const columnNameProp = () =>
	Property.Dropdown<string>({
		description: 'Column Name',
		displayName: 'The name of the column to search in',
		required: true,
		refreshers: ['sheetId', 'spreadsheetId'],
		options: async ({ auth, spreadsheetId, sheetId }) => {
			const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;
			const spreadsheet_id = spreadsheetId as string;
			const sheet_id = Number(sheetId) as number;
			const accessToken = authValue.access_token;

			if (
				!auth ||
				(spreadsheet_id ?? '').toString().length === 0 ||
				(sheet_id ?? '').toString().length === 0
			) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select a sheet first',
				};
			}

			const sheetName = await googleSheetsCommon.findSheetName(
				accessToken,
				spreadsheet_id,
				sheet_id,
			);

			if (!sheetName) {
				throw Error('Sheet not found in spreadsheet');
			}

			const headers = await getHeaderRow({
				spreadsheetId: spreadsheet_id,
				accessToken: accessToken,
				sheetId: sheet_id,
			});

			const ret = [];

			const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

			if (isNil(headers)) {
				return {
					options: [],
					disabled: false,
				};
			}
			if (headers.length === 0) {
				const columnSize = headers.length;

				for (let i = 0; i < columnSize; i++) {
					ret.push({
						label: alphabet[i].toUpperCase(),
						value: alphabet[i],
					});
				}
			} else {
				let index = 0;
				for (let i = 0; i < headers.length; i++) {
					let value = 'A';
					if (index >= alphabet.length) {
						// if the index is greater than the length of the alphabet, we need to add another letter
						const firstLetter = alphabet[Math.floor(index / alphabet.length) - 1];
						const secondLetter = alphabet[index % alphabet.length];
						value = firstLetter + secondLetter;
					} else {
						value = alphabet[index];
					}

					ret.push({
						label: headers[i].toString(),
						value: value,
					});
					index++;
				}
			}
			return {
				options: ret,
				disabled: false,
			};
		},
	});
