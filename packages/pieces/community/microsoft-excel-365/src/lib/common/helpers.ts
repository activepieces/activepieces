import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphBaseUrl } from './microsoft-cloud';

export function createMSGraphClient(accessToken: string, cloud?: string | null): Client {
	return Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(accessToken),
		},
		baseUrl: getGraphBaseUrl(cloud),
	});
}

export function numberToColumnName(num: number): string {
	let columnName = '';
	while (num > 0) {
		const modulo = (num - 1) % 26;
		columnName = String.fromCharCode(65 + modulo) + columnName;
		num = Math.floor((num - modulo) / 26);
	}
	return columnName;
}

export async function getLastUsedRow(
	accessToken: string,
	drivePath: string,
	workbookId: string,
	worksheetId: string,
	cloud?: string | null,
): Promise<number> {
	const client = createMSGraphClient(accessToken, cloud);

	const response = await client
		.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`)
		.get();

	const usedRange = response.address.split('!')[1];
	const lastCell = usedRange.indexOf(':') != -1 ? usedRange.split(':')[1] : usedRange;
	const lastRow = parseInt(lastCell.match(/\d+/)[0], 10);

	return lastRow;
}

export function getDrivePath(storageSource: string, siteId?: string, documentId?: string): string {
	if (storageSource === 'onedrive') {
		return '/me/drive';
	}
	// for sharepoint ensure siteId and documentId are provided
	if (!siteId || !documentId) {
		throw new Error('please select SharePoint site and document library.');
	}
	return `/sites/${siteId}/drives/${documentId}`;
}

export async function getHeaders(
	accessToken: string,
	drivePath: string,
	workbookId: string,
	worksheetId: string,
	cloud?: string | null,
) {
	const client = createMSGraphClient(accessToken, cloud);

	const response = await client
		.api(
			`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A1:ZZ1')/usedRange`
		)
		.get();
	const columns = response.values?.[0] ?? [];

	return columns;
}
