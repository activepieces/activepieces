import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { TableField } from './types';

export const databaseIdDropdown = Property.Dropdown({
	displayName: 'Database ID',
	description: 'Select the database to insert the record into',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first',
			};
		}

		try {
			const databases = await makeRequest<{
				data: { id: string; name: string }[];
			}>(auth as string, HttpMethod.GET, '/databases');
			return {
				disabled: false,
				options: databases.data.map((database) => ({
					label: database.name,
					value: database.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading teams',
			};
		}
	},
});

export const tableIdDropdown = Property.Dropdown({
	displayName: 'Table ID',
	description: 'Select the table to insert the record into',
	required: true,
	refreshers: ['auth', 'databaseId'],
	options: async ({ auth, databaseId }) => {
		if (!auth || !databaseId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account and select a database first',
			};
		}

		try {
			const tables = await makeRequest<{
				data: { id: string; name: string }[];
			}>(auth as string, HttpMethod.GET, `/databases/${databaseId}/tables`);
			return {
				disabled: false,
				options: tables.data.map((table) => ({
					label: table.name,
					value: table.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading tables',
			};
		}
	},
});

export const recordIdField = Property.ShortText({
	displayName: 'Record ID',
	required: true,
});

export const tableFieldIdDropdown = Property.Dropdown({
	displayName:'Field',
	refreshers: ['auth', 'databaseId', 'tableId'],
	required:true,
	options:async ({auth,databaseId,tableId})=>{
		if (!auth || !databaseId || !tableId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account and select a table first.',
			};
		}

		try {
			const response = await makeRequest<{
				data: {
					fields: TableField[];
				};
			}>(auth as unknown as string, HttpMethod.GET, `/databases/${databaseId}/tables/${tableId}`);

			return {
				disabled: false,
				options: response.data.fields.map((field) => ({
					label: field.name,
					value: field.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading Fields.',
			};
		}

	}
})

export const tableFields = Property.DynamicProperties({
	displayName: 'Fields',
	required: true,
	refreshers: ['auth', 'databaseId', 'tableId'],
	props: async ({ auth, databaseId, tableId }) => {
		if (!databaseId || !tableId) {
			return {};
		}

		try {
			const response = await makeRequest<{
				data: {
					fields: TableField[];
				};
			}>(auth as unknown as string, HttpMethod.GET, `/databases/${databaseId}/tables/${tableId}`);

			const tableData = response.data || response;
			const fields = tableData.fields || [];
			const dynamicProps: DynamicPropsValue = {};

			fields.forEach((field) => {
				// Skip readonly fields
				if (field.readonly) {
					return;
				}

				const fieldId = field.id;
				const fieldName = field.name || fieldId;
				const fieldType = field.type;
				const isRequired = false;

				switch (fieldType) {
					case 'SINGLE_LINE_TEXT':
					case 'EMAIL':
					case 'URL':
					case 'PHONE':
						dynamicProps[fieldId] = Property.ShortText({
							displayName: fieldName,
							required: isRequired,
						});
						break;

					case 'SELECT': {
						const options = field.options.choices
							? field.options.choices.map((option) => ({
									label: option.label,
									value: option.id,
							  }))
							: [];
						dynamicProps[fieldId] = field.allowMultipleEntries
							? Property.StaticMultiSelectDropdown({
									displayName: fieldName,
									required: isRequired,
									options: { options },
							  })
							: Property.StaticDropdown({
									displayName: fieldName,
									required: isRequired,
									options: { options },
							  });
						break;
					}
					case 'LONG_TEXT':
						dynamicProps[fieldId] = Property.LongText({
							displayName: fieldName,
							required: isRequired,
						});
						break;

					case 'NUMBER':
					case 'CURRENCY':
					case 'PERCENT':
					case 'RATING':
						dynamicProps[fieldId] = Property.Number({
							displayName: fieldName,
							required: isRequired,
						});
						break;
					case 'CHECKBOX':
						dynamicProps[fieldId] = Property.Checkbox({
							displayName: fieldName,
							required: isRequired,
						});
						break;
					case 'DATETIME':
						dynamicProps[fieldId] = Property.DateTime({
							displayName: fieldName,
							required: isRequired,
						});
						break;
					default:
						break;
				}
			});

			return dynamicProps;
		} catch (error) {
			console.error('Error fetching table fields:', error);
			return {};
		}
	},
});
