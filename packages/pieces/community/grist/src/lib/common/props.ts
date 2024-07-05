import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gristAuth } from '../..';
import { GristTableColumnsResponse, GristTableResponse, GristWorkspaceResponse } from './types';

export const commonProps = {
	workspace_id: Property.Dropdown({
		displayName: 'Workspace',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect account first.',
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

			const response = await httpClient.sendRequest<GristWorkspaceResponse[]>({
				method: HttpMethod.GET,
				url: `https://${authValue.domain}/api/orgs/current/workspaces`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.apiKey,
				},
			});

			const options: DropdownOption<number>[] = [];
			for (const workspace of response.body) {
				options.push({ label: workspace.name, value: workspace.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	document_id: Property.Dropdown({
		displayName: 'Document',
		refreshers: ['workspace_id'],
		required: true,
		options: async ({ auth, workspace_id }) => {
			if (!auth || !workspace_id) {
				return {
					disabled: true,
					placeholder: 'Please connect account and select workspace.',
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

			const response = await httpClient.sendRequest<GristWorkspaceResponse>({
				method: HttpMethod.GET,
				url: `https://${authValue.domain}/api/workspaces/${workspace_id}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.apiKey,
				},
			});

			const options: DropdownOption<string>[] = [];
			for (const document of response.body.docs) {
				options.push({ label: document.name, value: document.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	table_id: Property.Dropdown({
		displayName: 'Table',
		refreshers: ['document_id'],
		required: true,
		options: async ({ auth, document_id }) => {
			if (!auth || !document_id) {
				return {
					disabled: true,
					placeholder: 'Please connect account and select document.',
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

			const response = await httpClient.sendRequest<{ tables: GristTableResponse[] }>({
				method: HttpMethod.GET,
				url: `https://${authValue.domain}/api/docs/${document_id}/tables`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.apiKey,
				},
			});

			const options: DropdownOption<string>[] = [];
			for (const table of response.body.tables) {
				options.push({ label: table.id, value: table.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	table_columns: Property.DynamicProperties({
		displayName: 'Table Columns',
		refreshers: ['document_id', 'table_id'],
		required: true,
		props: async ({ auth, document_id, table_id }) => {
			if (!auth) return {};
			if (!document_id) return {};
			if (!table_id) return {};

			const fields: DynamicPropsValue = {};

			const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

			const response = await httpClient.sendRequest<{ columns: GristTableColumnsResponse[] }>({
				method: HttpMethod.GET,
				url: `https://${authValue.domain}/api/docs/${document_id}/tables/${table_id}/columns`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.apiKey,
				},
			});

			for (const column of response.body.columns) {
				switch (column.fields.type) {
					case 'Any':
						fields[column.id] = Property.ShortText({
							displayName: column.fields.label || column.id,
							required: false,
						});
						break;
					case 'Bool':
						fields[column.id] = Property.Checkbox({
							displayName: column.fields.label || column.id,
							required: false,
						});
						break;
					case 'Choice':
					case 'ChoiceList':
						let options = [];
						try {
							const optionsObject = JSON.parse(column.fields.widgetOptions);
							options = optionsObject['choices'] as any[];
						} catch (error) {
							options = [];
						}

						const dropdownConfig = {
							displayName: column.fields.label || column.id,
							required: false,
							options: {
								disabled: false,
								options: options.map((choice) => {
									return {
										label: choice,
										value: choice,
									};
								}),
							},
						};

						fields[column.id] =
							column.fields.type === 'Choice'
								? Property.StaticDropdown(dropdownConfig)
								: Property.StaticMultiSelectDropdown(dropdownConfig);
						break;
					case 'Date':
						fields[column.id] = Property.DateTime({
							displayName: column.fields.label || column.id,
							required: false,
						});
						break;
					case 'Int':
					case 'Numerics':
						fields[column.id] = Property.Number({
							displayName: column.fields.label || column.id,
							required: false,
						});
						break;
					case 'Text':
						fields[column.id] = Property.LongText({
							displayName: column.fields.label || column.id,
							required: false,
						});
						break;
					default:
						if (column.fields.type.startsWith('DateTime')) {
							fields[column.id] = Property.DateTime({
								displayName: column.fields.label || column.id,
								required: false,
							});
						} else if (column.fields.type.startsWith('RefList')) {
							fields[column.id] = Property.Array({
								displayName: column.fields.label || column.id,
								required: false,
							});
						} else if (column.fields.type.startsWith('Ref')) {
							fields[column.id] = Property.Number({
								displayName: column.fields.label || column.id,
								required: false,
							});
						}
						break;
				}
			}

			return fields;
		},
	}),
};
