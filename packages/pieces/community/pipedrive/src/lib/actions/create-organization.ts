import { pipedriveAuth } from '../../index';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { fetchOwnersOptions, retriveObjectCustomProperties } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'create-organization',
	displayName: 'Create Organization',
	description: 'Creates a new organization.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
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
					resourceUri: '/organizationFields:(key,name,options)',
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
		address:Property.LongText({
			displayName:'Address',
			required:false
		}),
		customfields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			refreshers: [],
			required: false,
			props: async ({ auth }) => {
				if (!auth) return {};

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				return await retriveObjectCustomProperties(authValue, 'organization');
			},
		}),
	},
	async run(context) {
		const { name, ownerId,address, visibleTo } = context.propsValue;

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const organizationDefaultFields: Record<string, any> = {
			name: name,
			owner_id: ownerId,
			visible_to: visibleTo,
			address:address
		};

		if (labelIds.length > 0) {
			organizationDefaultFields.label_ids = labelIds;
		}

		const organizationCustomFiels: Record<string, string> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			organizationCustomFiels[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdOrganizationResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/organizations',
			body: {
				...organizationDefaultFields,
				...organizationCustomFiels,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const updatedOrganizationProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdOrganizationResponse.data,
		);

		return {
			...createdOrganizationResponse,
			data: updatedOrganizationProperties,
		};
	},
});
