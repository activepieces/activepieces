import { pipedriveAuth } from '../../index';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import {
	fetchOrganizationsOptions,
	fetchOwnersOptions,
	fetchPersonsOptions,
	retriveObjectCustomProperties,
} from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'create-lead',
	displayName: 'Create Lead',
	description: 'Creates a new lead.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
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

				const labelField = customFieldsResponse.find((field) => field.key === 'label_ids');
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
		expectedCloseDate: Property.ShortText({
			displayName: 'Expected Close Date',
			required: false,
			description: 'Please enter date in YYYY-MM-DD format.',
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
        channel:Property.MultiSelectDropdown({
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

				const channelField = customFieldsResponse.find((field) => field.key === 'channel');
				const options: DropdownOption<number>[] = [];
				if (channelField) {
					for (const option of channelField.options ?? []) {
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
		leadValue: Property.Number({
			displayName: 'Lead Value',
			required: false,
		}),
		leadValueCurrency: Property.ShortText({
			displayName: 'Lead Value Currency',
			required: false,
			description: 'Please enter currency code.',
		}),
		customfields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			refreshers: [],
			required: false,
			props: async ({ auth }) => {
				if (!auth) return {};

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				return await retriveObjectCustomProperties(authValue, 'lead');
			},
		}),
	},
	async run(context) {
		const {
			title,
			ownerId,
            channel,
			organizationId,
			personId,
			expectedCloseDate,
			visibleTo,
			leadValue,
			leadValueCurrency,
		} = context.propsValue;

        if(!personId && !organizationId){

            throw new Error("Neither an Organization nor a Person were provided. One of them must be provided in order to create a lead.");

        }

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const leadDefaultFields: Record<string, any> = {
			title,
			owner_id: ownerId,
			organization_id: organizationId,
			person_id: personId,
            channel:channel,
			expected_close_date: expectedCloseDate,
			visible_to: visibleTo,
		};



		if (labelIds.length > 0) {
			leadDefaultFields.label_ids = labelIds;
		}

        if(leadValue)
		{
			if(!leadValueCurrency)
			{
				throw new Error('lead Value Currency is required when lead Value is provided');
			}
			leadDefaultFields.value = {
				amount: leadValue,
				currency: leadValueCurrency
			}
		}


		const leadCustomFields: Record<string, any> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			leadCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdLeadResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/leads',
			body: {
				...leadDefaultFields,
				...leadCustomFields,
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
			createdLeadResponse.data,
		);

		return {
			...createdLeadResponse,
			data: updatedLeadProperties,
		};
	},
});
