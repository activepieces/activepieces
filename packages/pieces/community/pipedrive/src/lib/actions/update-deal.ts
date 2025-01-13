import { pipedriveAuth } from '../../index';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import {
	fetchDealsOptions,
	fetchOrganizationsOptions,
	fetchOwnersOptions,
	fetchPersonsOptions,
	fetchPipelinesOptions,
	retriveObjectCustomProperties,
} from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, OrganizationCreateResponse, StageWithPipelineInfo } from '../common/types';

export const updateDealAction = createAction({
	auth: pipedriveAuth,
	name: 'update-deal',
	displayName: 'Update Deal',
	description: 'Updates an existing deal.',
	props: {
		dealId: Property.Dropdown({
			displayName: 'Deal',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchDealsOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		creationTime: Property.DateTime({
			displayName: 'Creation Time',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Open',
						value: 'open',
					},
					{
						label: 'Won',
						value: 'won',
					},
					{
						label: 'Lost',
						value: 'lost',
					},
					{
						label: 'Deleted',
						value: 'deleted',
					},
				],
			},
		}),
		stageId: Property.Dropdown({
			displayName: 'Stage',
			description: 'If a stage is chosen above, the pipeline field will be ignored.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						placeholder: 'please connect your account.',
						disabled: true,
						options: [],
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const response = await pipedrivePaginatedApiCall<StageWithPipelineInfo>({
					accessToken: authValue.access_token,
					apiDomain: authValue.data['api_domain'],
					method: HttpMethod.GET,
					resourceUri: '/stages',
				});

				const options: DropdownOption<number>[] = [];
				for (const stage of response) {
					options.push({
						label: `${stage.name} (${stage.pipeline_name})`,
						value: stage.id,
					});
				}

				return {
					disabled: false,
					options,
				};
			},
		}),
		pipelineId: Property.Dropdown({
			displayName: 'Pipeline',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchPipelinesOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		ownerId: Property.Dropdown({
			displayName: 'Owner',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchOwnersOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		organizationId: Property.Dropdown({
			displayName: 'Organization',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchOrganizationsOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		personId: Property.Dropdown({
			displayName: 'Person',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchPersonsOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		labelIds: Property.MultiSelectDropdown({
			displayName: 'Label',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
					accessToken: authValue.access_token,
					apiDomain: authValue.data['api_domain'],
					method: HttpMethod.GET,
					resourceUri: '/dealFields:(key,name,options)',
				});

				const labelField = customFieldsResponse.find((field) => field.key === 'label');
				const options: DropdownOption<number>[] = [];
				if (labelField) {
					for (const option of labelField.options ?? []) {
						options.push({
							label: option.label,
							value: option.id,
						});
					}
				}

				return {
					disabled: false,
					options,
				};
			},
		}),
		probability: Property.Number({
			displayName: 'Probability',
			required: false,
		}),
		expectedCloseDate: Property.ShortText({
			displayName: 'Expected Close Date',
			required: false,
			description: 'Please enter date in YYYY-MM-DD format.',
		}),
		dealValue: Property.Number({
			displayName: 'Value',
			required: false,
		}),
		dealValueCurrency: Property.ShortText({
			displayName: 'Currency',
			required: false,
			description: 'Please enter currency code.',
		}),
		visibleTo: Property.StaticDropdown({
			displayName: 'Visible To',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Item Owner',
						value: 1,
					},
					{
						label: 'All Users',
						value: 3,
					},
				],
			},
		}),
		customfields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			refreshers: [],
			required: false,
			props: async ({ auth }) => {
				if (!auth) return {};

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				return await retriveObjectCustomProperties(authValue, 'deal');
			},
		}),
	},
	async run(context) {
		const {
            dealId,
			title,
			dealValue,
			dealValueCurrency,
			expectedCloseDate,
			visibleTo,
			probability,
			stageId,
			status,
			pipelineId,
			ownerId,
			organizationId,
			personId,
			creationTime,
		} = context.propsValue;

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const dealDefaultFields: Record<string, any> = {
			title,
			pipeline_id: pipelineId,
			stage_id: stageId,
			status,
			add_time: creationTime,
			probability,
			expected_close_date: expectedCloseDate,
			visible_to: visibleTo,
			user_id: ownerId,
			org_id: organizationId,
			person_id: personId,
			value: dealValue,
			currency: dealValueCurrency,
		};

		if (labelIds.length > 0) {
			dealDefaultFields.label = labelIds;
		}

		const dealCustomFields: Record<string, any> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			dealCustomFields[key] = Array.isArray(value) && value.length > 0 ? value.join(',') : value;
		});

		const updatedDealResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PUT,
			resourceUri: `/deals/${dealId}`,
			body: {
				...dealDefaultFields,
				...dealCustomFields,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const updatedLeadProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedDealResponse.data,
		);

		return {
			...updatedDealResponse,
			data: updatedLeadProperties,
		};
	},
});
