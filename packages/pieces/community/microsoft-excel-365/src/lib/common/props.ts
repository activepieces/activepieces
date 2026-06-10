import { DropdownOption, DynamicPropsValue, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { createMSGraphClient, getHeaders } from './helpers';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Drive, DriveItem, Site } from '@microsoft/microsoft-graph-types';
import { isEmpty } from '@activepieces/shared';
import { excelAuth } from '../auth';

const createEmptyOptions = (message: string) => {
	return {
		placeholder: message,
		options: [],
		disabled: true,
	};
};

export const commonProps = {
	storageSource: Property.StaticDropdown({
		displayName: 'Excel File Source',
		required: true,
		defaultValue: 'onedrive',
		options: {
			disabled: false,
			options: [
				{ label: 'OneDrive', value: 'onedrive' },
				{ label: 'SharePoint', value: 'sharepoint' },
			],
		},
	}),
	isFirstRowHeaders: Property.Checkbox({
		displayName: 'Does the first row contain headers?',
		description: 'If the first row is headers',
		required: true,
		defaultValue: false,
	}),
	siteId: Property.Dropdown({
		displayName: 'Sharepoint Site',
		auth: excelAuth,
		refreshers: ['storageSource'],
		required: false,
		options: async ({ auth, storageSource }) => {
			if (!auth) {
				return createEmptyOptions('please connect your account first.');
			}
			if (storageSource !== 'sharepoint') {
				return createEmptyOptions('please select sharepoint as file source.');
			}
			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			let response: PageCollection = await client
				.api('/sites?search=*&$select=displayName,id,name')
				.get();

			while (response.value.length > 0) {
				for (const site of response.value as Site[]) {
					options.push({ label: site.displayName!, value: site.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	documentId: Property.Dropdown({
		displayName: 'Sharepoint Document Library',
		auth: excelAuth,
		refreshers: ['storageSource', 'siteId'],
		required: false,
		options: async ({ auth, storageSource, siteId }) => {
			if (!auth) {
				return createEmptyOptions('please connect your account first.');
			}

			if (storageSource !== 'sharepoint') {
				return createEmptyOptions('please select sharepoint as file source.');
			}

			if (!siteId) {
				return createEmptyOptions('please select sharepoint site first.');
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			let response: PageCollection = await client
				.api(`/sites/${siteId}/drives`)
				.select('id,name')
				.get();

			while (response.value.length > 0) {
				for (const drive of response.value as Drive[]) {
					options.push({ label: drive.name!, value: drive.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	workbookId: Property.Dropdown({
		displayName: 'Workbook',
		refreshers: ['storageSource', 'siteId', 'documentId'],
		required: true,
		auth: excelAuth,
		options: async ({ auth, storageSource, siteId, documentId }) => {
			if (!auth) {
				return createEmptyOptions('please connect your account first.');
			}
			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'please select SharePoint site and document library first.'
				);
			}

			const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
			const client = createMSGraphClient(auth.access_token, cloud);

			const options: DropdownOption<string>[] = [];

			const drivePath =
				storageSource === 'onedrive'
					? '/me/drive'
					: `/sites/${siteId}/drives/${documentId}`;

			let response: PageCollection = await client
				.api(`${drivePath}/root/search(q='.xlsx')`)
				.select('id,name')
				.get();

			while (response.value.length > 0) {
				for (const file of response.value as DriveItem[]) {
					options.push({ label: file.name!, value: file.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	worksheetId: Property.Dropdown({
		auth: excelAuth,
		displayName: 'Worksheet',
		required: true,
		refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId'],
		options: async ({ auth, storageSource, siteId, documentId, workbookId }) => {
			if (!auth) {
				return createEmptyOptions('please connect your account first.');
			}

			if (!workbookId) {
				return createEmptyOptions('please select a workbook first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'please select SharePoint site and document library first.'
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
			description: 'The values to insert',
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
						description: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}
				return columns;

				const fields: DynamicPropsValue = {
					values: Property.Array({
						displayName: 'Values',
						required: true,
						properties: columns,
					}),
				};

				return fields;
			},
		}),

	worksheetMultiValues :Property.DynamicProperties({
			auth: excelAuth,
			displayName: 'Values',
			description: 'The values to insert',
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
						description: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}

				const fields: DynamicPropsValue = {
					values: Property.Array({
						displayName: 'Values',
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
				return createEmptyOptions('please connect your account first.');
			}
			if (!workbookId) {
				return createEmptyOptions('please select a workbook first.');
			}
			if (!worksheetId) {
				return createEmptyOptions('please select a worksheet first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'please select SharePoint site and document library first.'
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
		displayName: 'Filter Column',
		refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
		auth: excelAuth,
		required: false,
		async options({ auth, storageSource, siteId, workbookId, documentId, worksheetId }) {
			if (!auth) {
				return createEmptyOptions('please connect your account first.');
			}

			if (!workbookId) {
				return createEmptyOptions('please select a workbook first.');
			}
			if (!worksheetId) {
				return createEmptyOptions('please select a worksheet first.');
			}

			if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
				return createEmptyOptions(
					'please select SharePoint site and document library first.'
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
