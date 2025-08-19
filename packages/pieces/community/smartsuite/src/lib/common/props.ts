import { Property, DynamicPropsValue, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteApiCall, smartSuitePaginatedApiCall, TableStucture } from '.';
import { smartsuiteAuth } from '../auth';
import { isNil } from '@activepieces/shared';

export const smartsuiteCommon = {
	solutionId: Property.Dropdown({
		displayName: 'Solution',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please enter your API key first.',
				};
			}

			const { apiKey, accountId } = auth as PiecePropValueSchema<typeof smartsuiteAuth>;

			try {
				const response = await smartSuitePaginatedApiCall<{
					name: string;
					id: string;
					hidden: boolean;
				}>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: '/solutions',
				});

				return {
					disabled: false,
					options: response
						.filter((solution) => !solution.hidden)
						.map((solution) => {
							return {
								label: solution.name,
								value: solution.id,
							};
						}),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Error fetching solutions. Please check your API key.',
				};
			}
		},
	}),

	tableId: Property.Dropdown({
		displayName: 'Table',
		required: true,
		refreshers: ['solutionId'],
		options: async ({ auth, solutionId }) => {
			if (!auth || !solutionId) {
				return {
					disabled: true,
					options: [],
					placeholder: solutionId
						? 'Please select a solution first.'
						: 'Please enter your API key first.',
				};
			}

			const { apiKey, accountId } = auth as PiecePropValueSchema<typeof smartsuiteAuth>;

			try {
				const response = await smartSuitePaginatedApiCall<{
					id: string;
					name: string;
				}>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: '/applications',
					query: {
						solution: solutionId as string,
					},
				});

				return {
					disabled: false,
					options: response.map((table) => {
						return {
							label: table.name,
							value: table.id,
						};
					}),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Error fetching tables. Please check your permissions.',
				};
			}
		},
	}),
	tableFields: Property.DynamicProperties({
		displayName: 'Fields',
		required: true,
		refreshers: ['solutionId', 'tableId'],
		props: async ({ auth, solutionId, tableId }) => {
			if (!auth || !solutionId || !tableId) {
				return {};
			}
			const { apiKey, accountId } = auth as PiecePropValueSchema<typeof smartsuiteAuth>;

			try {
				const response = await smartSuiteApiCall<{
					structure: TableStucture[];
				}>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: `/applications/${tableId}`,
				});

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
				return {};
			}
		},
	}),

	recordId: Property.ShortText({
		displayName: 'Record ID',
		required: true,
	}),
};

export function formatRecordFields(
	tableSchema: TableStucture[],
	tableValues: Record<string, any>,
): Record<string, any> {
	const formattedFields: Record<string, any> = {};

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

export function transformRecordFields(
	tableSchema: TableStucture[],
	tableValues: Record<string, any>,
) {
	const fieldMap: Record<string, string> = tableSchema.reduce((acc, field) => {
		acc[field.slug] = field.label;
		return acc;
	}, {} as Record<string, string>);

	const transformedFields: Record<string, any> = {};

	for (const [slug, value] of Object.entries(tableValues)) {
		const label = fieldMap[slug] ?? slug;
		transformedFields[label] = value;
	}

	return transformedFields;
}
