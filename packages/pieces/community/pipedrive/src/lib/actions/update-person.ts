import { pipedriveAuth } from '../../index';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import {
	fetchOrganizationOptions,
	fetchOwnersOptions,
	fetchPersonsOptions,
	retriveObjectCustomProperties,
} from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, PersonCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatePersonAction = createAction({
	auth: pipedriveAuth,
	name: 'update-person',
	displayName: 'Update Person',
	description: 'Updates an existing person.',
	props: {
		personId: Property.Dropdown({
			displayName: 'Person',
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
				const options = await fetchPersonsOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
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
				const options = await fetchOrganizationOptions(authValue);

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
		const {
			name,
			ownerId,
			personId,
			organizationId,
			marketing_status,
			visibleTo,
			firstName,
			lastName,
		} = context.propsValue;
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
			personCustomFiels[key] = Array.isArray(value) && value.length > 0 ? value.join(',') : value;
		});

		const updatedPersonResponse = await pipedriveApiCall<PersonCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PUT,
			resourceUri: `/persons/${personId}`,
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
			updatedPersonResponse.data,
		);

		return {
			...updatedPersonResponse,
			data: updatedPersonProperties,
		};
	},
});
