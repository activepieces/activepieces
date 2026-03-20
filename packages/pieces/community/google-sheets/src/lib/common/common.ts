import { AppConnectionValueForAuthProperty, OAuth2PropertyValue, OAuth2Props, PieceAuth, PiecePropValueSchema, Property, ShortTextProperty, StaticPropsValue } from '@activepieces/pieces-framework';
import {
	httpClient,
	HttpMethod,
	AuthenticationType,
	HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionType, isNil, isString } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { mapRowsToColumnLabels } from '../triggers/helpers';

export type GoogleSheetsAuthValue = AppConnectionValueForAuthProperty<typeof googleSheetsAuth>
export const googleSheetsCommon = {
	baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
	getGoogleSheetRows,
	findSheetName,
	deleteRow,
	clearSheet,
	getHeaderRow,
};

export async function findSheetName(
	auth: GoogleSheetsAuthValue,
	spreadsheetId: string,
	sheetId: string | number,
) {
	const sheets = await listSheetsName(auth, spreadsheetId);
	const sheetName = sheets.find((f) => f.properties.sheetId == sheetId)?.properties.title;
	if (!sheetName) {
		throw Error(`Sheet with ID ${sheetId} not found in spreadsheet ${spreadsheetId}`);
	}
	return sheetName;
}

async function listSheetsName(auth: GoogleSheetsAuthValue, spreadsheet_id: string) {
	return (
		await httpClient.sendRequest<{
			sheets: { properties: { title: string; sheetId: number } }[];
		}>({
			method: HttpMethod.GET,
			url: `https://sheets.googleapis.com/v4/spreadsheets/` + spreadsheet_id,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: await getAccessToken(auth),
			},
		})
	).body.sheets;
}

type GetGoogleSheetRowsProps = {
	spreadsheetId: string;
	auth: GoogleSheetsAuthValue;
	sheetId: number;
	rowIndex_s: number | undefined;
	rowIndex_e: number | undefined;
	headerRow?: number;
};

async function getGoogleSheetRows({
	spreadsheetId,
	auth,
	sheetId,
	rowIndex_s,
	rowIndex_e,
	headerRow = 1,
}: GetGoogleSheetRowsProps): Promise<{ row: number; values: { [x: string]: string } }[]> {
	const sheetName = await findSheetName(auth, spreadsheetId, sheetId);
	if (!sheetName) {
		return [];
	}

	let range = '';
	if (rowIndex_s !== undefined) {
		range = `!A${rowIndex_s}:ZZZ`;
	}
	if (rowIndex_s !== undefined && rowIndex_e !== undefined) {
		range = `!A${rowIndex_s}:ZZZ${rowIndex_e}`;
	}
	const rowsResponse = await httpClient.sendRequest<{ values: [string[]][] }>({
		method: HttpMethod.GET,
		url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}${range}`)}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: await getAccessToken(auth),
		},
	});
	if (rowsResponse.body.values === undefined) return [];

	const headerResponse = await httpClient.sendRequest<{ values: [string[]][] }>({
		method: HttpMethod.GET,
		url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A${headerRow}:ZZZ${headerRow}`)}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: await getAccessToken(auth),
		},
	});

	if (!headerResponse.body.values) {
		throw new Error(`Unable to read headers from row ${headerRow} in sheet "${sheetName}". The row appears to be empty or inaccessible.`);
	}

	const headers = headerResponse.body.values[0] ?? [];
	const headerCount = headers.length;

	const startingRow = rowIndex_s ? rowIndex_s - 1 : 0;

	const labeledRowValues = mapRowsToColumnLabels(
		rowsResponse.body.values,
		startingRow,
		headerCount,
	);

	return labeledRowValues;
}

type GetHeaderRowProps = {
	spreadsheetId: string;
	auth: GoogleSheetsAuthValue;
	sheetId: number;
};

export async function getHeaderRow({
	spreadsheetId,
	auth,
	sheetId,
}: GetHeaderRowProps): Promise<string[] | undefined> {
	const rows = await getGoogleSheetRows({
		spreadsheetId,
		auth,
		sheetId,
		rowIndex_s: 1,
		rowIndex_e: 1,
		headerRow: 1,
	});
	if (rows.length === 0) {
		return undefined;
	}
	return objectToArray(rows[0].values);
}

export const columnToLabel = (columnIndex: number) => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let label = '';

	while (columnIndex >= 0) {
		label = alphabet[columnIndex % 26] + label;
		columnIndex = Math.floor(columnIndex / 26) - 1;
	}

	return label;
};
export const labelToColumn = (label: string) => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let column = 0;

	for (let i = 0; i < label.length; i++) {
		column += (alphabet.indexOf(label[i]) + 1) * Math.pow(26, label.length - i - 1);
	}

	return column - 1;
};

export function objectToArray(obj: { [x: string]: any }) {
	const maxIndex = Math.max(...Object.keys(obj).map((key) => labelToColumn(key)));
	const arr = new Array(maxIndex + 1);
	for (const key in obj) {
		arr[labelToColumn(key)] = obj[key];
	}
	return arr;
}

export function stringifyArray(object: unknown[]): string[] {
	return object.map((val) => {
		if (isString(val)) {
			return val;
		}
		return JSON.stringify(val);
	});
}

export async function mapRowsToHeaderNames(
	rows:any[],
	useHeaderNames: boolean,
	spreadsheetId: string,
	sheetId: number,
	headerRow: number,
	auth: GoogleSheetsAuthValue,
): Promise<any[]> {
	if (!useHeaderNames) {
		return rows;
	}

	const headerRows = await getGoogleSheetRows({
		spreadsheetId,
		auth,
		sheetId,
		rowIndex_s: headerRow,
		rowIndex_e: headerRow,
	});

	if (headerRows.length === 0) {
		return rows;
	}

	const headers = Object.values(headerRows[0].values);
	if (headers.length === 0) {
		return rows;
	}

	// map rows to use header names as keys instead of column letters
	return rows.map(row => {
		const newValues: Record<string, any> = {};
		Object.keys(row.values).forEach((columnLetter) => {
			const columnIndex = labelToColumn(columnLetter);
			const headerName = headers[columnIndex];
			if (headerName) {
				newValues[headerName] = row.values[columnLetter];
			}
			else{
				newValues[columnLetter] = row.values[columnLetter];
			}
		});
		return { ...row, values: newValues };
	});
}

async function deleteRow(
	spreadsheetId: string,
	sheetId: number,
	rowIndex: number,
	auth: GoogleSheetsAuthValue,
) {
	const request: HttpRequest = {
		method: HttpMethod.POST,
		url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/:batchUpdate`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: await getAccessToken(auth),
		},
		body: {
			requests: [
				{
					deleteDimension: {
						range: {
							sheetId: sheetId,
							dimension: 'ROWS',
							startIndex: rowIndex,
							endIndex: rowIndex + 1,
						},
					},
				},
			],
		},
	};
	await httpClient.sendRequest(request);
}

async function clearSheet(
	spreadsheetId: string,
	sheetId: number,
	auth: GoogleSheetsAuthValue,
	rowIndex: number,
	numOfRows: number,
) {
	const request: HttpRequest = {
		method: HttpMethod.POST,
		url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/:batchUpdate`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: await getAccessToken(auth),
		},
		body: {
			requests: [
				{
					deleteDimension: {
						range: {
							sheetId: sheetId,
							dimension: 'ROWS',
							startIndex: rowIndex,
							endIndex: rowIndex + numOfRows + 1,
						},
					},
				},
			],
		},
	};
	return await httpClient.sendRequest(request);
}

export enum ValueInputOption {
	RAW = 'RAW',
	USER_ENTERED = 'USER_ENTERED',
}

export enum Dimension {
	ROWS = 'ROWS',
	COLUMNS = 'COLUMNS',
}

export async function createGoogleClient(auth: GoogleSheetsAuthValue): Promise<OAuth2Client> {
	if(auth.type === AppConnectionType.CUSTOM_AUTH)
	{
		const serviceAccount = JSON.parse(auth.props.serviceAccount);
		return new google.auth.JWT({
			email: serviceAccount.client_email,
			key: serviceAccount.private_key,
			scopes: googleSheetsScopes,
			subject: auth.props.userEmail,
		});
	}
	const authClient = new OAuth2Client();
    authClient.setCredentials(auth);
	return authClient;
}

export const getAccessToken = async (auth: GoogleSheetsAuthValue): Promise<string> => {
	if(auth.type === AppConnectionType.CUSTOM_AUTH)
	{
		const googleClient = await createGoogleClient(auth);
	    const response = await googleClient.getAccessToken();
		if(response.token)
		{
			return response.token;
		}
		else {
			throw new Error('Could not retrieve access token from service account json');
		}
	}
	return auth.access_token;
}

export function areSheetIdsValid(spreadsheetId: string | null | undefined, sheetId: string | number | null | undefined): boolean {
    return !isNil(spreadsheetId) && spreadsheetId !== "" &&
           !isNil(sheetId) && sheetId !== "";
}

export const googleSheetsScopes = [
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/drive',
  ]

export const googleSheetsAuth =[PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://accounts.google.com/o/oauth2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	required: true,
	scope:googleSheetsScopes ,
  }), PieceAuth.CustomAuth({
	displayName: 'Service Account (Advanced)',
	description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access spreadsheets without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to files/folders you explicitly share with it.',
	required: true,
	props: {
	  serviceAccount: Property.ShortText({
		displayName: 'Service Account JSON Key',
		required: true,
	  } 
	) , 
	userEmail: Property.ShortText({
		displayName: 'User Email',
		required: false,
		description: 'Email address of the user to impersonate for domain-wide delegation.',
	  }),},
	  validate: async ({auth})=>{
		try{
			await getAccessToken({
				type: AppConnectionType.CUSTOM_AUTH,
				props: {...auth}
			});
		}catch(e){
			return {
				valid: false,
				error: (e as Error).message,
			};
		}
		return {
			valid: true,
		};
	  }
	})];

	