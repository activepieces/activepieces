import { DropdownOption, DynamicPropsValue, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { createMSGraphClient, getHeaders } from './helpers';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Drive, DriveItem, Site } from '@microsoft/microsoft-graph-types';
import { isEmpty } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';

const MAX_FOLDER_OPTIONS = 1000;

const createEmptyOptions = (message: string) => {
	return {
		placeholder: message,
		options: [],
		disabled: true,
	};
};

const listDriveItemsRecursively = async ({
	client,
	drivePath,
	collect,
}: {
	client: Client;
	drivePath: string;
	collect: 'folders' | 'workbooks';
}) => {
	const options: DropdownOption<string>[] = [];
	const queue: { id: string; path: string }[] = [{ id: 'root', path: '' }];
	let visitedFolders = 0;

	while (queue.length > 0 && options.length < MAX_FOLDER_OPTIONS && visitedFolders < MAX_FOLDER_OPTIONS) {
		const current = queue.shift();
		if (!current) {
			break;
		}
		visitedFolders++;

		let response: PageCollection | undefined = await client
			.api(`${drivePath}/items/${current.id}/children`)
			.select('id,name,folder,file')
			.get();

		while (response && options.length < MAX_FOLDER_OPTIONS) {
			for (const item of (response.value ?? []) as DriveItem[]) {
				if (!item.id || !item.name) {
					continue;
				}
				const path = current.path ? `${current.path}/${item.name}` : item.name;
				if (item.folder) {
					if (collect === 'folders') {
						options.push({ label: path, value: item.id });
					}
					if ((item.folder.childCount ?? 0) > 0) {
						queue.push({ id: item.id, path });
					}
				} else if (collect === 'workbooks' && item.file && item.name.toLowerCase().endsWith('.xlsx')) {
					options.push({ label: path, value: item.id });
				}
			}
			const nextLink = response['@odata.nextLink'];
			response = nextLink ? await client.api(nextLink).get() : undefined;
		}
	}

	return options;
};

const createWorkbookDropdown = <R extends boolean>({
	displayName,
	description,
	required,
	folderRefresherKey,
}: {
	displayName: string;
	description?: string;
	required: R;
	folderRefresherKey?: string;
}) =>
	Property.Dropdown({
		displayName,
		description,
		refreshers: folderRefresherKey
			? ['storageSource', 'siteId', 'documentId', folderRefresherKey]
			: ['storageSource', 'siteId', 'documentId'],
		required,
		auth: excelAuth,
		options: async (ctx) => {
			const { auth, storageSource, siteId, documentId } = ctx;
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}
			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'Choose a SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			const scopedFolderId = folderRefresherKey ? ctx[folderRefresherKey] : undefined;

			if (scopedFolderId) {
				let response: PageCollection | undefined = await client
					.api(`${drivePath}/items/${scopedFolderId}/children`)
					.select('id,name,file')
					.get();

				while (response) {
					for (const item of (response.value ?? []) as DriveItem[]) {
						if (item.file && item.name?.toLowerCase().endsWith('.xlsx')) {
							options.push({ label: item.name, value: item.id! });
						}
					}
					const nextLink = response['@odata.nextLink'];
					response = nextLink ? await client.api(nextLink).get() : undefined;
				}

				return {
					disabled: false,
					options,
				};
			}

			let response: PageCollection | undefined = await client
				.api(`${drivePath}/root/search(q='.xlsx')`)
				.select('id,name')
				.get();

			while (response) {
				for (const file of (response.value ?? []) as DriveItem[]) {
					options.push({ label: file.name!, value: file.id! });
				}
				const nextLink = response['@odata.nextLink'];
				response = nextLink ? await client.api(nextLink).get() : undefined;
			}

			if (options.length === 0) {
				return {
					disabled: false,
					options: await listDriveItemsRecursively({ client, drivePath, collect: 'workbooks' }),
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const commonProps = {
	storageSource: Property.StaticDropdown({
		displayName: 'Location',
		required: true,
		defaultValue: 'onedrive',
		display: 'cards',
		options: {
			disabled: false,
			options: [
				{ label: 'OneDrive', value: 'onedrive', icon: 'user' },
				{ label: 'SharePoint', value: 'sharepoint', icon: 'users' },
			],
		},
	}),
	isFirstRowHeaders: Property.Checkbox({
		displayName: 'First Row Contains Headers',
		description: 'Turn on to get one field per column header.',
		required: true,
		defaultValue: false,
	}),
	siteId: Property.Dropdown({
		displayName: 'SharePoint Site',
		auth: excelAuth,
		refreshers: ['storageSource'],
		required: false,
		options: async ({ auth, storageSource }) => {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}
			if (storageSource !== 'sharepoint') {
				return createEmptyOptions('Choose SharePoint as the location first.');
			}
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			let response: PageCollection | undefined = await client
				.api('/sites?search=*&$select=displayName,id,name')
				.get();

			while (response) {
				for (const site of (response.value ?? []) as Site[]) {
					options.push({ label: site.displayName!, value: site.id! });
				}
				const nextLink = response['@odata.nextLink'];
				response = nextLink ? await client.api(nextLink).get() : undefined;
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	documentId: Property.Dropdown({
		displayName: 'Document Library',
		auth: excelAuth,
		refreshers: ['storageSource', 'siteId'],
		required: false,
		options: async ({ auth, storageSource, siteId }) => {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}

			if (storageSource !== 'sharepoint') {
				return createEmptyOptions('Choose SharePoint as the location first.');
			}

			if (!siteId) {
				return createEmptyOptions('Choose a SharePoint site first.');
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			let response: PageCollection | undefined = await client
				.api(`/sites/${siteId}/drives`)
				.select('id,name')
				.get();

			while (response) {
				for (const drive of (response.value ?? []) as Drive[]) {
					options.push({ label: drive.name!, value: drive.id! });
				}
				const nextLink = response['@odata.nextLink'];
				response = nextLink ? await client.api(nextLink).get() : undefined;
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	workbookDropdown: createWorkbookDropdown,
	folderId: Property.Dropdown({
		auth: excelAuth,
		displayName: 'Folder',
		description: 'Narrows the workbook list below.',
		required: false,
		refreshers: ['storageSource', 'siteId', 'documentId'],
		options: async ({ auth, storageSource, siteId, documentId }) => {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}
			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'Choose a SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			return {
				disabled: false,
				options: await listDriveItemsRecursively({ client, drivePath, collect: 'folders' }),
			};
		},
	}),
	workbookId: createWorkbookDropdown({
		displayName: 'Workbook',
		required: true,
	}),
	destinationWorkbookId: createWorkbookDropdown({
		displayName: 'Destination Workbook',
		description: 'Empty copies within the same workbook.',
		required: false,
	}),
	worksheetId: Property.Dropdown({
		auth: excelAuth,
		displayName: 'Worksheet',
		required: true,
		refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId'],
		options: async ({ auth, storageSource, siteId, documentId, workbookId }) => {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}

			if (!workbookId) {
				return createEmptyOptions('Choose a workbook first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'Choose a SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			const response: PageCollection = await client
				.api(`${drivePath}/items/${workbookId}/workbook/worksheets`)
				.select('id,name')
				.get();

			return {
				disabled: false,
				options: response.value.map((worksheet: { id: string; name: string }) => {
					return {
						label: worksheet.name,
						value: worksheet.name,
					};
				}),
			};
		},
	}),
	worksheetValues: 
		Property.DynamicProperties({
			auth: excelAuth,
			displayName: 'Values',
			description: 'One value per column, starting at column A.',
			required: true,
			refreshers: [
				'storageSource',
				'siteId',
				'documentId',
				'workbookId',
				'worksheetId',
				'isFirstRowHeaders',
			],
			props: async ({
				auth,
				storageSource,
				siteId,
				workbookId,
				documentId,
				worksheetId,
				isFirstRowHeaders,
			}) => {
				if (
					!auth ||
					(workbookId ?? '').toString().length === 0 ||
					(worksheetId ?? '').toString().length === 0
				) {
					return {};
				}

				if (storageSource === 'sharepoint' && (!siteId || !documentId)) return {};

				if (!isFirstRowHeaders) {
					return {
						values: Property.Array({
							displayName: 'Values',
							description: 'One value per column, starting at column A.',
							required: true,
						}),
					};
				}

				const drivePath =
					storageSource === 'onedrive'
						? '/me/drive'
						: `/sites/${siteId}/drives/${documentId}`;

				const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

				const firstRow = await getHeaders(
					auth.access_token,
					drivePath,
					workbookId as unknown as string,
					worksheetId as unknown as string,
					cloud
				);

				const columns: {
					[key: string]: any;
				} = {};
				for (const key in firstRow) {
					columns[key] = Property.ShortText({
						displayName: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}
				return columns;
			},
		}),

	worksheetMultiValues :Property.DynamicProperties({
			auth: excelAuth,
			displayName: 'Values',
			description: 'One row per item, one value per column.',
			required: true,
			refreshers: [
				'storageSource',
				'siteId',
				'documentId',
				'workbookId',
				'worksheetId',
			],
			props: async ({
				auth,
				storageSource,
				siteId,
				workbookId,
				documentId,
				worksheetId,
			}) => {
				if (
					!auth ||
					(workbookId ?? '').toString().length === 0 ||
					(worksheetId ?? '').toString().length === 0
				) {
					return {};
				}

				if (storageSource === 'sharepoint' && (!siteId || !documentId)) return {};

				const drivePath =
					storageSource === 'onedrive'
						? '/me/drive'
						: `/sites/${siteId}/drives/${documentId}`;

				const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

				const firstRow = await getHeaders(
					auth.access_token,
					drivePath,
					workbookId as unknown as string,
					worksheetId as unknown as string,
					cloud
				);

				const columns: {
					[key: string]: any;
				} = {};
				for (const key in firstRow) {
					columns[key] = Property.ShortText({
						displayName: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}

				const fields: DynamicPropsValue = {
					values: Property.Array({
						displayName: 'Values',
						description: 'One row per item, one value per column.',
						required: true,
						properties: columns,
					}),
				};

				return fields;
			},
		}),

	tableId: Property.Dropdown({
		displayName: 'Table',
		auth: excelAuth,
		required: true,
		refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
		options: async ({ auth, storageSource, siteId, documentId, workbookId, worksheetId }) => {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}
			if (!workbookId) {
				return createEmptyOptions('Choose a workbook first.');
			}
			if (!worksheetId) {
				return createEmptyOptions('Choose a worksheet first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'Choose a SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);
			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			const response: PageCollection = await client
				.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables`)
				.select('id,name')
				.get();

			const options: DropdownOption<string>[] = [];
			for (const t of response.value as DriveItem[]) {
				options.push({ label: t.name!, value: t.id! });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),

	filterColumn: Property.Dropdown({
		displayName: 'Column',
		description: 'The column the condition checks.',
		refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
		auth: excelAuth,
		required: false,
		async options({ auth, storageSource, siteId, workbookId, documentId, worksheetId }) {
			if (!auth) {
				return createEmptyOptions('Connect your account first.');
			}

			if (!workbookId) {
				return createEmptyOptions('Choose a workbook first.');
			}
			if (!worksheetId) {
				return createEmptyOptions('Choose a worksheet first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'Choose a SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			const firstRow = await getHeaders(
				auth.access_token,
				drivePath,
				workbookId as unknown as string,
				worksheetId as unknown as string,
				cloud
			);

			const options: DropdownOption<string>[] = [];

			for (const key in firstRow) {
				if (isEmpty(firstRow[key])) continue;
				options.push({ value: key, label: firstRow[key].toString() });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
};
