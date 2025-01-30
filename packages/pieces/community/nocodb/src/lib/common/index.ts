import { nocodbAuth } from '../../';
import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { NocoDBClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof nocodbAuth>) {
	return new NocoDBClient(auth.baseUrl, auth.apiToken);
}

export const nocodbCommon = {
	workspaceId: Property.Dropdown({
		displayName: 'Workspace ID',
		refreshers: [],
		required: false,
		description: 'For self-hosted instances,select "No Workspace".',
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}

			const client = makeClient(auth as PiecePropValueSchema<typeof nocodbAuth>);
			try
			{
				const response = await client.listWorkspaces();
				return {
					disabled: false,
					options: response.list.map((workspace) => {
						return {
							label: workspace.title,
							value: workspace.id,
						};
					}),
				};

			}
			catch(error)
			{
				return{
					disabled:false,
					options:[{
						label:'No Workspace',
						value:'none'
					}]
				}
			}

			
		},
	}),
	baseId: Property.Dropdown({
		displayName: 'Base ID',
		refreshers: ['workspaceId'],
		required: true,
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}

			try {
				const client = makeClient(auth as PiecePropValueSchema<typeof nocodbAuth>);
				const response = await client.listBases(workspaceId as string || undefined, (auth as PiecePropValueSchema<typeof nocodbAuth>).version || 3);

				return {
					disabled: false,
					options: response.list.map((base) => {
						return {
							label: base.title,
							value: base.id,
						};
					}),
				};
			} catch (error) {
				console.error('Error fetching bases:', error);
				return {
					disabled: true,
					placeholder: 'Error fetching bases. Please check your connection and version.',
					options: [],
				};
			}
		},
	}),
	tableId: Property.Dropdown({
		displayName: 'Table ID',
		refreshers: ['workspaceId', 'baseId'],
		required: true,
		options: async ({ auth, baseId }) => {
			if (!auth || !baseId) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select base.',
					options: [],
				};
			}

			const client = makeClient(auth as PiecePropValueSchema<typeof nocodbAuth>);
			const response = await client.listTables(baseId as string, (auth as PiecePropValueSchema<typeof nocodbAuth>).version || 3);

			return {
				disabled: false,
				options: response.list.map((table) => {
					return {
						label: table.title,
						value: table.id,
					};
				}),
			};
		},
	}),
	columnId: Property.MultiSelectDropdown({
		displayName: 'Fields',
		description:
			'Allows you to specify the fields that you wish to include in your API response. By default, all the fields are included in the response.',
		refreshers: ['workspaceId', 'baseId', 'tableId'],
		required: false,
		options: async ({ auth, baseId, tableId }) => {
			if (!auth || !baseId || !tableId) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select base.',
					options: [],
				};
			}

			const client = makeClient(auth as PiecePropValueSchema<typeof nocodbAuth>);
			const response = await client.getTable(tableId as unknown as string, (auth as PiecePropValueSchema<typeof nocodbAuth>).version || 3);

			return {
				disabled: false,
				options: response.columns.map((column) => {
					return {
						label: column.title,
						value: column.title,
					};
				}),
			};
		},
	}),
	tableColumns: Property.DynamicProperties({
		displayName: 'Table Columns',
		refreshers: ['tableId'],
		required: true,
		props: async ({ auth, tableId }) => {
			if (!auth) return {};
			if (!tableId) return {};

			const fields: DynamicPropsValue = {};

			const client = makeClient(auth as PiecePropValueSchema<typeof nocodbAuth>);
			const response = await client.getTable(tableId as unknown as string, (auth as PiecePropValueSchema<typeof nocodbAuth>).version || 3);

			for (const column of response.columns) {
				switch (column.uidt) {
					case 'SingleLineText':
					case 'PhoneNumber':
					case 'Email':
					case 'URL':
						fields[column.title] = Property.ShortText({
							displayName: column.title,
							required: false,
						});
						break;
					case 'LongText':
						fields[column.title] = Property.LongText({
							displayName: column.title,
							required: false,
						});
						break;
					case 'Number':
					case 'Decimal':
					case 'Percent':
					case 'Rating':
					case 'Currency':
					case 'Year':
						fields[column.title] = Property.Number({
							displayName: column.title,
							required: false,
						});
						break;
					case 'Checkbox':
						fields[column.title] = Property.Checkbox({
							displayName: column.title,
							required: true,
						});
						break;
					case 'MultiSelect':
						fields[column.title] = Property.StaticMultiSelectDropdown({
							displayName: column.title,
							required: false,
							options: {
								disabled: false,
								options: column.colOptions
									? column.colOptions.options.map((option) => {
											return {
												label: option.title,
												value: option.title,
											};
									  })
									: [],
							},
						});
						break;
					case 'SingleSelect':
						fields[column.title] = Property.StaticDropdown({
							displayName: column.title,
							required: false,
							options: {
								disabled: false,
								options: column.colOptions
									? column.colOptions.options.map((option) => {
											return {
												label: option.title,
												value: option.title,
											};
									  })
									: [],
							},
						});
						break;
					case 'Date':
						fields[column.title] = Property.ShortText({
							displayName: column.title,
							required: false,
							description: column.meta?.['date_format']
								? `Please provide date in ${column.meta['date_format']} format.`
								: '',
						});
						break;
					case 'Time':
						fields[column.title] = Property.ShortText({
							displayName: column.title,
							required: false,
							description: 'Please provide time in HH:mm:ss format.',
						});
						break;
					case 'DateTime':
						fields[column.title] = Property.DateTime({
							displayName: column.title,
							required: false,
						});
						break;
					case 'JSON':
						fields[column.title] = Property.Json({
							displayName: column.title,
							required: false,
						});
						break;
					default:
						break;
				}
			}

			return fields;
		},
	}),
};
