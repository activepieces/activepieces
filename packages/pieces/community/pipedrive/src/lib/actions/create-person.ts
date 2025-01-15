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
	retriveObjectCustomProperties,
} from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, PersonCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'create-person',
	displayName: 'Create Person',
	description: 'Creates a new person.',
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
		email: Property.Array({
			displayName: 'Email',
			required: false,
		}),
		phone: Property.Array({
			displayName: 'Phone',
			required: false,
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
					resourceUri: '/personFields:(key,name,options)',
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
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: false,
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
		marketing_status: Property.StaticDropdown<string>({
			displayName: 'Marketing Status',
			description: 'Marketing opt-in status',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'No Consent',
						value: 'no_consent',
					},
					{
						label: 'Unsubscribed',
						value: 'unsubscribed',
					},
					{
						label: 'Subscribed',
						value: 'subscribed',
					},
					{
						label: 'Archived',
						value: 'archived',
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
				return await retriveObjectCustomProperties(authValue, 'person');
			},
		}),
	},
	async run(context) {
		const { name, ownerId, organizationId, marketing_status, visibleTo, firstName, lastName } =
			context.propsValue;
		const phone = (context.propsValue.phone as string[]) ?? [];
		const email = (context.propsValue.email as string[]) ?? [];
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const personDefaultFields: Record<string, any> = {
			name: name,
			owner_id: ownerId,
			org_id: organizationId,
			marketing_status: marketing_status,
			visible_to: visibleTo,
			first_name: firstName,
			last_name: lastName,
		};

		if (phone.length > 0) {
			personDefaultFields.phone = phone;
		}

		if (email.length > 0) {
			personDefaultFields.email = email;
		}

        if(labelIds.length > 0) {
            personDefaultFields.label_ids = labelIds;
        }

		const personCustomFiels: Record<string, string> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			personCustomFiels[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdPersonResponse = await pipedriveApiCall<PersonCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/persons',
			body: {
				...personDefaultFields,
				...personCustomFiels,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/personFields',
		});

		const updatedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdPersonResponse.data,
		);

		return {
			...createdPersonResponse,
			data: updatedPersonProperties,
		};
	},
});
