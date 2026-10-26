import { DropdownOption, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { codaClient, CodaTableColumn } from './types';
import { codaApi } from './client';
import { codaAuth } from '../auth';

export const docIdDropdown = Property.Dropdown({
	auth: codaAuth,
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
		const client = codaClient(auth);
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
				placeholder: dropdownErrorPlaceholder({ error, what: 'docs' }),
			};
		}
	},
});

export const tableIdDropdown = Property.Dropdown({
	auth: codaAuth,
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
		const client = codaClient(auth);
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
				placeholder: dropdownErrorPlaceholder({ error, what: 'tables' }),
			};
		}
	},
});

export const tableRowsDynamicProps = Property.DynamicProperties({
	auth: codaAuth,
	displayName: 'Row Data',
	description: 'Define the data for the new row based on table columns.',
	required: true,
	refreshers: ['docId', 'tableId'],
	props: async ({ tableId, auth, docId }) => {
		if (!auth || !docId || !tableId) {
			return {};
		}

		const client = codaClient(auth);
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

			for (const column of columns) {
				const field = columnToProperty(column);
				if (field) {
					fields[column.id] = field;
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
		auth: codaAuth,
		displayName,
		required: true,
		refreshers: ['docId', 'tableId'],
		options: async ({ auth, docId, tableId }) => {
			if (!auth || !docId || !tableId) {
				return {
					disabled: true,
					placeholder: !auth ? 'Connect your Coda account first.' : 'Select a document and table first.',
					options: [],
				};
			}
			const client = codaClient(auth);
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
					placeholder: dropdownErrorPlaceholder({ error, what: 'columns' }),
				};
			}
		},
	});
};

function dropdownErrorPlaceholder({ error, what }: { error: unknown; what: string }): string {
	const status = codaApi.statusOf(error);
	if (status === 401 || status === 403) {
		return `Could not list ${what}: the Coda API token is invalid or has no access. Reconnect your account.`;
	}
	if (status === 404) {
		return `Could not list ${what}: the selected doc or table was not found.`;
	}
	if (status === 429) {
		return `Could not list ${what}: Coda rate limit reached. Wait a few seconds and refresh.`;
	}
	return `Could not list ${what}: ${error instanceof Error ? error.message : 'unknown error'}`;
}

export function columnToProperty(column: CodaTableColumn) {
	if (column.calculated) {
		return undefined;
	}
	switch (column.format.type) {
		case 'text':
		case 'link':
		case 'email':
			return Property.ShortText({ displayName: column.name, required: false });
		case 'select':
		case 'lookup':
			return Property.ShortText({
				displayName: column.name,
				required: false,
				description: column.format.isArray ? 'Provide options as comma-separated values.' : '',
			});
		case 'number':
		case 'currency':
		case 'percent':
		case 'slider':
		case 'scale':
		case 'duration':
			return Property.Number({ displayName: column.name, required: false });
		case 'date':
		case 'dateTime':
		case 'time':
			return Property.DateTime({ displayName: column.name, required: false });
		case 'checkbox':
			return Property.Checkbox({ displayName: column.name, required: false });
		default:
			return undefined;
	}
}
