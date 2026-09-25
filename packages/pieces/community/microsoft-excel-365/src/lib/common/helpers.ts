import { Client } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
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

export function createMSGraphClientFromAuth({ auth }: { auth: OAuth2PropertyValue }): Client {
	const cloud = auth.props?.['cloud'];
	return createMSGraphClient(auth.access_token, typeof cloud === 'string' ? cloud : undefined);
}

export function getLocationDrivePath({ storageSource, siteId, driveId }: DriveLocation): string {
	return getDrivePath(storageSource ?? 'onedrive', siteId?.trim(), driveId?.trim());
}

export function getItemPath({ workbookId, ...location }: DriveLocation & { workbookId: string }): string {
	return `${getLocationDrivePath(location)}/items/${encodeURIComponent(requireValue({ value: workbookId, name: 'Workbook ID' }))}`;
}

export function getWorkbookPath(params: DriveLocation & { workbookId: string }): string {
	return `${getItemPath(params)}/workbook`;
}

export function getWorksheetPath({ worksheet, ...params }: DriveLocation & { workbookId: string; worksheet: string }): string {
	return `${getWorkbookPath(params)}/worksheets/${encodeURIComponent(requireValue({ value: worksheet, name: 'Worksheet' }))}`;
}

export function getTablePath({ table, ...params }: DriveLocation & { workbookId: string; table: string }): string {
	return `${getWorkbookPath(params)}/tables/${encodeURIComponent(requireValue({ value: table, name: 'Table' }))}`;
}

export function getChartPath({ chart, ...params }: DriveLocation & { workbookId: string; worksheet: string; chart: string }): string {
	return `${getWorksheetPath(params)}/charts/${encodeURIComponent(requireValue({ value: chart, name: 'Chart' }))}`;
}

export function getRangeSegment({ address }: { address: string }): string {
	const trimmed = requireValue({ value: address, name: 'Range address' });
	return `range(address='${trimmed.replace(/'/g, "''")}')`;
}

export function requireValue({ value, name }: { value: string | undefined | null; name: string }): string {
	const trimmed = value?.trim();
	if (!trimmed) {
		throw new Error(`${name} is required.`);
	}
	return trimmed;
}

export function parseJsonInput({ value, name }: { value: unknown; name: string }): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`${name} is not valid JSON.`);
	}
}

export function parseValues({ values, name }: { values: unknown; name: string }): unknown[][] {
	const parsed = parseJsonInput({ value: values, name });
	if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((row) => Array.isArray(row))) {
		throw new Error(`${name} must be a non-empty 2-D array, e.g. [["Name","Age"],["Ada",36]].`);
	}
	const width = parsed[0].length;
	if (width === 0 || !parsed.every((row) => row.length === width)) {
		throw new Error(`${name} rows must all have the same, non-zero number of cells.`);
	}
	return parsed;
}

export function parseSortFields({ fields }: { fields: unknown }): SortField[] {
	const parsed = parseJsonInput({ value: fields, name: 'Sort Fields' });
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Sort Fields must be a non-empty array, e.g. [{"key":0,"ascending":true}].');
	}
	return parsed.map((field: unknown) => {
		if (typeof field !== 'object' || field === null || !('key' in field)) {
			throw new Error('Each sort field must be an object with a numeric "key".');
		}
		const key = Number(field.key);
		if (!Number.isInteger(key) || key < 0) {
			throw new Error('Sort field "key" must be a 0-based column index.');
		}
		const ascending = 'ascending' in field ? field.ascending !== false : true;
		return { key, ascending };
	});
}

export function parseCellAddress({ cell }: { cell: string }): CellPosition | null {
	const match = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(cell.trim());
	if (!match) {
		return null;
	}
	const column = match[1]
		.toUpperCase()
		.split('')
		.reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
	return { row: Number(match[2]), column };
}

export function getFirstRowValues({ values }: { values: unknown }): unknown[] {
	if (!Array.isArray(values) || !Array.isArray(values[0])) {
		return [];
	}
	return values[0];
}

export async function collectWorkbooks({
	client,
	path,
	max,
}: {
	client: Client;
	path: string;
	max: number | undefined;
}): Promise<WorkbookSummary[]> {
	const collected: DriveItem[] = [];
	let next: string | undefined = path;
	while (next && (max === undefined || collected.length < max)) {
		const page: DriveItemPage = await client.api(next).get();
		collected.push(...(page.value ?? []).filter(isWorkbookFile));
		next = page['@odata.nextLink'] ?? undefined;
	}
	return (max === undefined ? collected : collected.slice(0, max)).map(toWorkbookSummary);
}

export function toPermissionSummary(permission: GraphPermission): PermissionSummary {
	const grantee = permission.grantedToV2?.user ?? permission.grantedTo?.user;
	const identities = permission.grantedToIdentitiesV2 ?? permission.grantedToIdentities ?? [];
	return {
		id: permission.id ?? null,
		roles: (permission.roles ?? []).join(', '),
		linkType: permission.link?.type ?? null,
		linkScope: permission.link?.scope ?? null,
		linkWebUrl: permission.link?.webUrl ?? null,
		grantedToName: grantee?.displayName ?? null,
		grantedToEmail: grantee?.email ?? null,
		grantedToId: grantee?.id ?? null,
		grantedToIdentities: identities
			.flatMap((identity) => {
				const value = identity.user?.email ?? identity.user?.displayName;
				return value ? [value] : [];
			})
			.join(', '),
		invitationEmail: permission.invitation?.email ?? null,
		inherited: permission.inheritedFrom !== undefined && permission.inheritedFrom !== null,
		expirationDateTime: permission.expirationDateTime ?? null,
	};
}

function isWorkbookFile(item: DriveItem): boolean {
	return item.file !== undefined && item.file !== null && (item.name ?? '').toLowerCase().endsWith('.xlsx');
}

function toWorkbookSummary(item: DriveItem): WorkbookSummary {
	return {
		id: item.id ?? null,
		name: item.name ?? null,
		webUrl: item.webUrl ?? null,
		size: item.size ?? null,
		lastModifiedDateTime: item.lastModifiedDateTime ?? null,
		parentId: item.parentReference?.id ?? null,
		driveId: item.parentReference?.driveId ?? null,
	};
}

type DriveItemPage = {
	value?: DriveItem[];
	'@odata.nextLink'?: string | null;
};

type GraphPermissionUser = { displayName?: string | null; email?: string | null; id?: string | null };

export type DriveLocation = {
	storageSource?: string | null;
	siteId?: string | null;
	driveId?: string | null;
};

export type SortField = { key: number; ascending: boolean };

export type CellPosition = { row: number; column: number };

export type WorkbookSummary = {
	id: string | null;
	name: string | null;
	webUrl: string | null;
	size: number | null;
	lastModifiedDateTime: string | null;
	parentId: string | null;
	driveId: string | null;
};

export type GraphPermission = {
	id?: string | null;
	roles?: string[] | null;
	link?: { type?: string | null; scope?: string | null; webUrl?: string | null } | null;
	grantedTo?: { user?: GraphPermissionUser | null } | null;
	grantedToV2?: { user?: GraphPermissionUser | null } | null;
	grantedToIdentities?: { user?: GraphPermissionUser | null }[] | null;
	grantedToIdentitiesV2?: { user?: GraphPermissionUser | null }[] | null;
	invitation?: { email?: string | null } | null;
	inheritedFrom?: { id?: string | null } | null;
	expirationDateTime?: string | null;
};

export type PermissionSummary = {
	id: string | null;
	roles: string;
	linkType: string | null;
	linkScope: string | null;
	linkWebUrl: string | null;
	grantedToName: string | null;
	grantedToEmail: string | null;
	grantedToId: string | null;
	grantedToIdentities: string;
	invitationEmail: string | null;
	inherited: boolean;
	expirationDateTime: string | null;
};
