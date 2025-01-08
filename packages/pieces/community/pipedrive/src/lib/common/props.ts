import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveApiCall, pipedrivePaginatedApiCall } from '.';
import { pipedriveAuth } from '../../index';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { GetField } from './types';


export async function fetchPersonsOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const persons = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/persons:(id,name)',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const person of persons.data) {
		options.push({
			label: person.name,
			value: person.id,
		});
	}

	return options;
}

export async function fetchOwnersOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const users = await pipedriveApiCall<{ data: Array<{ id: number; email: string }> }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/users:(id,email)',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const user of users.data) {
		options.push({
			label: user.email,
			value: user.id,
		});
	}

	return options;
}

export async function fetchOrganizationsOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const organizations = await pipedrivePaginatedApiCall<{ id: number; name: string }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/organizations:(id,name)',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const org of organizations) {
		options.push({
			label: org.name,
			value: org.id,
		});
	}

	return options;
}

export const ownerIdDropdown = (required: boolean) =>
	Property.Dropdown({
		displayName: 'Owner',
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
			const users = await pipedrivePaginatedApiCall<Record<string, any>>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/users',
				query: {
					sort: 'update_time DESC',
				},
			});

			const options: DropdownOption<number>[] = [];
			for (const user of users) {
				options.push({
					label: user.email,
					value: user.id,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

function createPropertyDefinition(property: GetField) {
	switch (property.field_type) {
		case 'varchar':
		case 'varchar_auto':
			return Property.ShortText({
				displayName: property.name,
				required: false,
			});
		case 'text':
		case 'address':
			return Property.LongText({
				displayName: property.name,
				required: false,
			});
		case 'enum':
			return Property.StaticDropdown({
				displayName: property.name,
				required: false,
				options: {
					disabled: false,
					options: property.options
						? property.options.map((option) => {
								return {
									label: option.label,
									value: option.id.toString(),
								};
						  })
						: [],
				},
			});
		case 'set':
			return Property.StaticMultiSelectDropdown({
				displayName: property.name,
				required: false,
				options: {
					disabled: false,
					options: property.options
						? property.options.map((option) => {
								return {
									label: option.label,
									value: option.id.toString(),
								};
						  })
						: [],
				},
			});
		case 'double':
		case 'monetary':
			return Property.Number({
				displayName: property.name,
				required: false,
			});
		case 'time':
		case 'timerange':
			return Property.ShortText({
				displayName: property.name,
				description: 'Please enter time in HH:mm:ss format.',
				required: false,
			});
		case 'int':
			return Property.Number({
				displayName: property.name,
				required: false,
			});
		case 'date':
		case 'daterange':
			return Property.DateTime({
				displayName: property.name,
				description: 'Please enter date in YYYY-MM-DD format.',
				required: false,
			});

		default:
			return null;
	}
}

export async function retriveObjectCustomProperties(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
	objectType: string,
) {
	let endpoint = '';

	switch (objectType) {
		case 'person':
			endpoint = '/personFields';
			break;
		case 'deal':
		case 'lead':
			endpoint = '/dealFields';
			break;
		case 'organization':
			endpoint = '/organizationFields';
			break;
		case 'product':
			endpoint = '/productFields';
			break;
	}

	const customFields = await pipedrivePaginatedApiCall<GetField>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: endpoint,
	});

	const props: DynamicPropsValue = {};

	for (const field of customFields) {
		if (!field.edit_flag) {
			continue;
		}
		const propertyDefinition = createPropertyDefinition(field);
		if (propertyDefinition) {
			props[field.key] = propertyDefinition;
		}
	}
	return props;
}
