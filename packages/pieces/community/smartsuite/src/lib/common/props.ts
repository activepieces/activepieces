import { Property, DynamicPropsValue, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteApi, smartSuitePaginatedApiCall, TableStucture } from '.';
import { smartsuiteAuth } from '../auth';
import { isNil } from '@activepieces/pieces-framework';
import { pagedList } from './paged-list';

export const smartsuiteCommon = {
	solutionId: Property.Dropdown({
		auth: smartsuiteAuth,
		displayName: 'Solution',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your SmartSuite account first.',
				};
			}
			const { apiKey, accountId } = auth.props;
			try {
				const solutions = await smartSuitePaginatedApiCall<{ name: string; id: string; hidden?: boolean }>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: '/solutions/',
					operation: 'list solutions',
				});
				return {
					disabled: false,
					options: solutions
						.filter((solution) => !solution.hidden)
						.map((solution) => ({ label: solution.name, value: solution.id })),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: `Could not load solutions: ${errorText(error)}`,
				};
			}
		},
	}),

	tableId: Property.Dropdown({
		auth: smartsuiteAuth,
		displayName: 'Table',
		required: true,
		refreshers: ['solutionId'],
		options: async ({ auth, solutionId }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Please connect your SmartSuite account first.' };
			}
			if (!solutionId) {
				return { disabled: true, options: [], placeholder: 'Please select a solution first.' };
			}
			const { apiKey, accountId } = auth.props;
			try {
				const tables = await smartSuitePaginatedApiCall<{ id: string; name: string }>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: '/applications/',
					query: { solution: String(solutionId) },
					operation: 'list tables',
				});
				return {
					disabled: false,
					options: tables.map((table) => ({ label: table.name, value: table.id })),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: `Could not load tables: ${errorText(error)}`,
				};
			}
		},
	}),

	tableFieldDropdown: ({ displayName, description, required, onlyTypes }: { displayName: string; description?: string; required: boolean; onlyTypes?: string[] }) =>
		Property.Dropdown({
			auth: smartsuiteAuth,
			displayName,
			description,
			required,
			refreshers: ['solutionId', 'tableId'],
			options: async ({ auth, tableId }) => {
				if (!auth) {
					return { disabled: true, options: [], placeholder: 'Please connect your SmartSuite account first.' };
				}
				if (!tableId) {
					return { disabled: true, options: [], placeholder: 'Please select a table first.' };
				}
				try {
					const table = await smartSuiteApi.getTable({ credentials: auth.props, tableId });
					const options: DropdownOption<string>[] = table.structure
						.filter((field) =>
							onlyTypes
								? onlyTypes.includes(field.field_type)
								: !field.params.is_auto_generated && !field.params.system,
						)
						.map((field) => ({ label: field.label, value: field.slug }));
					return { disabled: false, options };
				} catch (error) {
					return { disabled: true, options: [], placeholder: `Could not load fields: ${errorText(error)}` };
				}
			},
		}),

	tableFields: Property.DynamicProperties({
		auth: smartsuiteAuth,
		displayName: 'Fields',
		required: true,
		refreshers: ['solutionId', 'tableId'],
		props: async ({ auth, solutionId, tableId }) => {
			if (!auth || !solutionId || !tableId) {
				return {};
			}
			const { apiKey, accountId } = auth.props;

			try {
				const response = await smartSuiteApi.getTable({ credentials: { apiKey, accountId }, tableId });

				const fieldProperties: DynamicPropsValue = {};

				for (const field of response.structure) {
					if (
						field.params.is_auto_generated ||
						field.params.system ||
						[
							'countfield',
							'autonumberfield',
							'rollupfield',
							'votefield',
							'filefield',
							'fullnamefield',
							'addressfield',
							'daterangefield',
							'duedatefield',
							'userfield',
							'checklistfield',
							'signaturefield',
							'subitemsfield',
							'buttonfield',
							'lookupfield',
							'phonefield',
						].includes(field.field_type)
					) {
						continue;
					}

					switch (field.field_type) {
						case 'recordtitlefield':
						case 'textfield':
						case 'emailfield':
						case 'linkfield':
						case 'durationfield':
						case 'numberfield':
						case 'colorpickerfield':
						case 'percentfield':
						case 'currencyfield':
							fieldProperties[field.slug] = Property.ShortText({
								displayName: field.label,
								required: false,
							});
							break;
						case 'timefield':
							fieldProperties[field.slug] = Property.ShortText({
								displayName: field.label,
								description: 'Provide value in HH:mm:ss format.',
								required: false,
							});
							break;
						case 'richtextareafield':
						case 'textareafield':
							fieldProperties[field.slug] = Property.LongText({
								displayName: field.label,
								required: false,
							});
							break;
						case 'numbersliderfield':
						case 'percentcompletefield':
						case 'ratingfield':
							fieldProperties[field.slug] = Property.Number({
								displayName: field.label,
								required: false,
							});
							break;
						case 'yesnofield':
							fieldProperties[field.slug] = Property.Checkbox({
								displayName: field.label,
								required: false,
							});
							break;
						case 'datefield':
							fieldProperties[field.slug] = Property.DateTime({
								displayName: field.label,
								required: false,
							});
							break;
						case 'statusfield':
						case 'singleselectfield':
							fieldProperties[field.slug] = Property.StaticDropdown({
								displayName: field.label,
								required: false,
								options: {
									disabled: false,
									options: field.params.choices
										? field.params.choices.map((choice) => ({
												label: choice.label,
												value: choice.value,
										  }))
										: [],
								},
							});
							break;
						case 'linkedrecordfield':
							fieldProperties[field.slug] = Property.Array({
								displayName: field.label,
								required: false,
								description: 'Provide Record IDs to link.',
							});
							break;
						case 'multipleselectfield':
							fieldProperties[field.slug] = Property.StaticMultiSelectDropdown({
								displayName: field.label,
								required: false,
								options: {
									disabled: false,
									options: field.params.choices
										? field.params.choices.map((choice) => ({
												label: choice.label,
												value: choice.value,
										  }))
										: [],
								},
							});
							break;
					}
				}

				return fieldProperties;
			} catch (error) {
				return {
					loadError: Property.MarkDown({
						value: `Could not load the table fields: ${errorText(error)}`,
					}),
				};
			}
		},
	}),

	recordId: Property.ShortText({
		displayName: 'Record ID',
		required: true,
	}),

	recordDropdown: ({ displayName, description }: { displayName: string; description?: string }) =>
		Property.Dropdown({
			auth: smartsuiteAuth,
			displayName,
			description,
			required: true,
			refreshers: ['solutionId', 'tableId'],
			options: async ({ auth, tableId }) => {
				if (!auth) {
					return { disabled: true, options: [], placeholder: 'Please connect your SmartSuite account first.' };
				}
				if (!tableId) {
					return { disabled: true, options: [], placeholder: 'Please select a table first.' };
				}
				try {
					const page = await smartSuiteApi.listRecordsPage({
						credentials: auth.props,
						tableId,
						sort: [{ field: 'last_updated', direction: 'desc' }],
						limit: RECORD_OPTIONS_LIMIT,
						offset: 0,
					});
					const options: DropdownOption<string>[] = page.items
						.filter((record) => typeof record['id'] === 'string')
						.map((record) => ({ label: optionLabel({ primary: record['title'], fallback: String(record['id']) }), value: String(record['id']) }));
					return {
						disabled: false,
						options,
						placeholder: page.hasMore ? `Showing the ${RECORD_OPTIONS_LIMIT} most recently updated records.` : undefined,
					};
				} catch (error) {
					return { disabled: true, options: [], placeholder: `Could not load records: ${errorText(error)}` };
				}
			},
		}),

	deletedRecordDropdown: Property.Dropdown({
		auth: smartsuiteAuth,
		displayName: 'Deleted Record',
		description: 'A record in the trash of the selected table.',
		required: true,
		refreshers: ['solutionId', 'tableId'],
		options: async ({ auth, solutionId, tableId }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Please connect your SmartSuite account first.' };
			}
			if (!solutionId || !tableId) {
				return { disabled: true, options: [], placeholder: 'Please select a solution and table first.' };
			}
			try {
				const deleted = await smartSuiteApi.listDeletedRecords({ credentials: auth.props, solutionId: String(solutionId) });
				const options: DropdownOption<string>[] = deleted
					.filter((record) => record['application_id'] === tableId && typeof record['id'] === 'string')
					.map((record) => ({ label: optionLabel({ primary: record['title'], fallback: String(record['id']) }), value: String(record['id']) }));
				return { disabled: false, options, placeholder: options.length === 0 ? 'The trash of this table is empty.' : undefined };
			} catch (error) {
				return { disabled: true, options: [], placeholder: `Could not load deleted records: ${errorText(error)}` };
			}
		},
	}),

	memberDropdown: ({ displayName, description, required }: { displayName: string; description?: string; required: boolean }) =>
		Property.Dropdown({
			auth: smartsuiteAuth,
			displayName,
			description,
			required,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, options: [], placeholder: 'Please connect your SmartSuite account first.' };
				}
				try {
					const page = await pagedList.fetch({
						credentials: auth.props,
						path: '/applications/members/records/list/',
						limit: MEMBER_OPTIONS_LIMIT,
						offset: 0,
						operation: 'list members',
					});
					const options: DropdownOption<string>[] = page.items
						.filter((member) => typeof member['id'] === 'string')
						.map((member) => ({ label: memberLabel(member), value: String(member['id']) }));
					return { disabled: false, options };
				} catch (error) {
					return { disabled: true, options: [], placeholder: `Could not load members: ${errorText(error)}` };
				}
			},
		}),
};

const RECORD_OPTIONS_LIMIT = 100;
const MEMBER_OPTIONS_LIMIT = 1000;

function optionLabel({ primary, fallback }: { primary: unknown; fallback: string }): string {
	return typeof primary === 'string' && primary.trim().length > 0 ? primary : fallback;
}

function memberLabel(member: Record<string, unknown>): string {
	const fullName = member['full_name'];
	const name = fullName !== null && typeof fullName === 'object' ? Reflect.get(fullName, 'sys_root') : undefined;
	const emails = member['email'];
	const email = Array.isArray(emails) && typeof emails[0] === 'string' ? emails[0] : undefined;
	const base = optionLabel({ primary: name, fallback: email ?? String(member['id']) });
	return email && base !== email ? `${base} (${email})` : base;
}

function formatRecordFields({
	tableSchema,
	tableValues,
}: {
	tableSchema: TableStucture[];
	tableValues: Record<string, unknown>;
}): Record<string, unknown> {
	const formattedFields: Record<string, unknown> = {};

	const fieldMap: Record<string, string> = tableSchema.reduce((acc, field) => {
		acc[field.slug] = field.field_type;
		return acc;
	}, {} as Record<string, string>);

	for (const [key, value] of Object.entries(tableValues)) {
		if (isNil(value) || value === '') continue;

		const fieldType = fieldMap[key];
		switch (fieldType) {
			case 'recordtitlefield':
			case 'textfield':
			case 'durationfield':
			case 'timefield':
			case 'textareafield':
			case 'numberfield':
			case 'numbersliderfield':
			case 'percentfield':
			case 'currencyfield':
			case 'percentcompletefield':
			case 'ratingfield':
			case 'yesnofield':
			case 'singleselectfield':
				formattedFields[key] = value;
				break;
			case 'emailfield':
			case 'linkfield':
				formattedFields[key] = [value];
				break;
			case 'colorpickerfield':
				formattedFields[key] = [
					{
						value,
					},
				];
				break;
			case 'datefield':
				formattedFields[key] = {
					date: value,
					include_time: false,
				};
				break;
			case 'statusfield':
				formattedFields[key] = {
					value,
				};
				break;
			case 'richtextareafield':
				formattedFields[key] = {
					data: {
						type: 'doc',
						content: [
							{
								type: 'paragraph',
								attrs: {
									textAlign: 'left',
									size: 'medium',
								},
								content: [
									{
										type: 'text',
										text: value,
									},
								],
							},
						],
					},
				};
				break;
			case 'linkedrecordfield':
			case 'multipleselectfield': {
				if (Array.isArray(value) && value.length > 0) {
					formattedFields[key] = value;
				}
				break;
			}
			default:
				break;
		}
	}

	return formattedFields;
}

function transformRecordFields({
	tableSchema,
	tableValues,
}: {
	tableSchema: TableStucture[];
	tableValues: Record<string, unknown>;
}) {
	const fieldMap: Record<string, string> = tableSchema.reduce((acc, field) => {
		acc[field.slug] = field.label;
		return acc;
	}, {} as Record<string, string>);

	const transformedFields: Record<string, unknown> = {};

	for (const [slug, value] of Object.entries(tableValues)) {
		const label = fieldMap[slug] ?? slug;
		transformedFields[label] = value;
	}

	return transformedFields;
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export { formatRecordFields, transformRecordFields };
