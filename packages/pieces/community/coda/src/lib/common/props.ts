import { DropdownOption, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { codaClient, CodaTableColumn } from './types';

export const docIdDropdown = Property.Dropdown({
	displayName: 'Document',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your Coda account first.',
				options: [],
			};
		}
		const client = codaClient(auth as unknown as string);
		const docs: DropdownOption<string>[] = [];
		let nextPageToken: string | undefined = undefined;
		try {
			do {
				const response = await client.listDocs({
					limit: 100,
					pageToken: nextPageToken,
				});
				if (response.items) {
					docs.push(
						...response.items.map((doc) => ({
							label: doc.name,
							value: doc.id,
						})),
					);
				}
				nextPageToken = response.nextPageToken;
			} while (nextPageToken);

			return {
				disabled: false,
				options: docs,
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error listing docs, please check connection or API key permissions.',
			};
		}
	},
});

export const tableIdDropdown = Property.Dropdown({
	displayName: 'Table',
	required: true,
	refreshers: ['docId'],
	options: async ({ auth, docId }) => {
		if (!auth || !docId) {
			return {
				disabled: true,
				placeholder: !auth ? 'Connect your Coda account first.' : 'Select a document first.',
				options: [],
			};
		}
		const client = codaClient(auth as unknown as string);
		const tables: DropdownOption<string>[] = [];
		let nextPageToken: string | undefined = undefined;

		try {
			do {
				const response = await client.listTables(docId as unknown as string, {
					limit: 100,
					pageToken: nextPageToken,
					tableTypes: 'table',
				});
				if (response.items) {
					tables.push(
						...response.items.map((table) => ({
							label: table.name,
							value: table.id,
						})),
					);
				}
				nextPageToken = response.nextPageToken;
			} while (nextPageToken);

			return {
				disabled: false,
				options: tables,
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error listing tables. Check document ID or permissions.',
			};
		}
	},
});

export const tableRowsDynamicProps = Property.DynamicProperties({
	displayName: 'Row Data',
	description: 'Define the data for the new row based on table columns.',
	required: true,
	refreshers: ['docId', 'tableId'],
	props: async ({ tableId, auth, docId }) => {
		if (!auth || !docId || !tableId) {
			return {};
		}

		const client = codaClient(auth as unknown as string);
		const fields: DynamicPropsValue = {};

		try {
			const columns: CodaTableColumn[] = [];
			let nextPageToken: string | undefined = undefined;
			do {
				const columnsResponse = await client.listColumns(
					docId as unknown as string,
					tableId as unknown as string,
					{
						limit: 100,
						pageToken: nextPageToken,
					},
				);
				if (columnsResponse.items) {
					columns.push(...columnsResponse.items);
				}
				nextPageToken = columnsResponse.nextPageToken;
			} while (nextPageToken);

			if (columns.length > 0) {
				for (const column of columns) {
					if (column.calculated) {
						continue;
					}

					switch (column.format.type.toLowerCase()) {
						case 'text':
						case 'link':
						case 'email':
							fields[column.id] = Property.ShortText({
								displayName: column.name,
								required: false,
							});
							break;
						case 'select':
						case 'lookup':
							fields[column.id] = Property.ShortText({
								displayName: column.name,
								required: false,
								description: column.format.isArray
									? 'Provide options as comma seprated values.'
									: '',
							});
							break;

						case 'number':
						case 'currency':
						case 'percent':
						case 'slider':
						case 'scale':
						case 'duration':
							fields[column.id] = Property.Number({
								displayName: column.name,
								required: false,
							});
							break;
						case 'date':
						case 'dateTime':
						case 'time':
							fields[column.id] = Property.DateTime({
								displayName: column.name,
								required: false,
							});
							break;
						case 'checkbox':
							fields[column.id] = Property.Checkbox({
								displayName: column.name,
								required: false,
							});
							break;
						default:
							break;
					}
				}
			}
			return fields;
		} catch (error) {
			console.error('Coda: Failed to fetch table columns for dynamic properties:', error);
			return {};
		}
	},
});

export const columnIdsDropdown = (displayName: string, singleSelect = true) => {
	const dropdownType = singleSelect ? Property.Dropdown : Property.MultiSelectDropdown;
	return dropdownType({
		displayName,
		required: true,
		refreshers: ['docId', 'tableId'],
		options: async ({ auth, docId, tableId }) => {
			if (!auth || !docId || !tableId) {
				return {
					disabled: true,
					placeholder: 'Connect your Coda account first.',
					options: [],
				};
			}
			const client = codaClient(auth as unknown as string);
			const columns: DropdownOption<string>[] = [];
			let nextPageToken: string | undefined = undefined;
			try {
				do {
					const response = await client.listColumns(
						docId as unknown as string,
						tableId as unknown as string,
						{
							limit: 100,
							pageToken: nextPageToken,
						},
					);
					if (response.items) {
						columns.push(
							...response.items.map((column) => ({
								label: column.name,
								value: column.id,
							})),
						);
					}
					nextPageToken = response.nextPageToken;
				} while (nextPageToken);

				return {
					disabled: false,
					options: columns,
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Error listing docs, please check connection or API key permissions.',
				};
			}
		},
	});
};
