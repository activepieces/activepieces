import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveApiCall, pipedrivePaginatedApiCall } from '.';
import { pipedriveAuth } from '../../index';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { GetField, StageWithPipelineInfo } from './types';
import { isNil } from '@activepieces/shared';

export async function fetchFiltersOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
	type: string,
): Promise<DropdownOption<number>[]> {
	const filters = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/filters',
		query: {
			type: type,
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const filter of filters.data) {
		options.push({
			label: filter.name,
			value: filter.id,
		});
	}

	return options;
}

export async function fetchProductsOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const products = await pipedrivePaginatedApiCall<{ id: number; name: string }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/products',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const product of products) {
		options.push({
			label: product.name,
			value: product.id,
		});
	}

	return options;
}

export async function fetchDealsOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const deals = await pipedrivePaginatedApiCall<{ id: number; title: string }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/deals',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const deal of deals) {
		options.push({
			label: deal.title,
			value: deal.id,
		});
	}

	return options;
}

export async function fetchLeadsOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const leads = await pipedrivePaginatedApiCall<{ id: number; title: string }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/leads',
		query: {
			sort: 'update_time DESC',
		},
	});

	const options: DropdownOption<number>[] = [];
	for (const lead of leads) {
		options.push({
			label: lead.title,
			value: lead.id,
		});
	}

	return options;
}

export async function fetchActivityTypesOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<string>[]> {
	const activityTypes = await pipedriveApiCall<{
		data: Array<{ key_string: string; name: string }>;
	}>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/activityTypes:(key_string,name)',
	});

	const options: DropdownOption<string>[] = [];
	for (const type of activityTypes.data) {
		options.push({
			label: type.name,
			value: type.key_string,
		});
	}

	return options;
}

export async function fetchPipelinesOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
	const pipelines = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/pipelines:(id,name)',
	});

	const options: DropdownOption<number>[] = [];
	for (const pipeline of pipelines.data) {
		options.push({
			label: pipeline.name,
			value: pipeline.id,
		});
	}

	return options;
}

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

export function createPropertyDefinition(property: GetField) {
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

export async function retrieveObjectCustomProperties(
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

export const searchFieldProp = (objectType: string) =>
	Property.Dropdown({
		displayName: 'Field to search by',
		required: true,
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

			const response = await pipedrivePaginatedApiCall<GetField>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: endpoint,
			});

			const options: DropdownOption<string>[] = [];

			for (const field of response) {
				if (!isNil(field.id)) {
					options.push({
						label: field.name,
						value: field.id,
					});
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const searchFieldValueProp = (objectType: string) =>
	Property.DynamicProperties({
		displayName: 'Field Value',
		required: true,
		refreshers: ['searchField'],
		props: async ({ auth, searchField }) => {
			if (!auth || !searchField) return {};

			const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
			const props: DynamicPropsValue = {};

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

			const response = await pipedriveApiCall<{ data: GetField }>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: `${endpoint}/${searchField}`,
			});

			const propertyDefinition =
				response.data.field_type === 'set'
					? Property.StaticDropdown({
							displayName: response.data.name,
							required: false,
							options: {
								disabled: false,
								options: response.data.options
									? response.data.options.map((option) => {
											return {
												label: option.label,
												value: option.id.toString(),
											};
									  })
									: [],
							},
					  })
					: createPropertyDefinition(response.data);

			if (propertyDefinition) {
				props['field_value'] = propertyDefinition;
			} else {
				props['field_value'] = Property.ShortText({
					displayName: response.data.name,
					required: false,
				});
			}
			return props;
		},
	});

export const customFieldsProp = (objectType: string) =>
	Property.DynamicProperties({
		displayName: 'Custom Fields',
		refreshers: [],
		required: false,
		props: async ({ auth }) => {
			if (!auth) return {};

			const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
			return await retrieveObjectCustomProperties(authValue, objectType);
		},
	});

export const ownerIdProp = (displayName: string, required = false) =>
	Property.Dropdown({
		displayName,
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
			const options = await fetchOwnersOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const filterIdProp = (type: string, required = false) =>
	Property.Dropdown({
		displayName: 'Filter',
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
			const options = await fetchFiltersOptions(authValue, type);

			return {
				disabled: false,
				options,
			};
		},
	});

export const organizationIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Organization',
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
			const options = await fetchOrganizationsOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const dealPipelineIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Pipeline',
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
			const options = await fetchPipelinesOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const dealStageIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Stage',
		description: 'If a stage is chosen above, the pipeline field will be ignored.',
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account.',
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
	});

export const personIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Person',
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
			const options = await fetchPersonsOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const labelIdsProp = (objectType: string, labelFieldName: string, required = false) =>
	Property.MultiSelectDropdown({
		displayName: 'Label',
		required,
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

			let endpoint = '';

			switch (objectType) {
				case 'person':
					endpoint = '/personFields:(key,name,options)';
					break;
				case 'deal':
					endpoint = '/dealFields:(key,name,options)';
					break;
				case 'organization':
					endpoint = '/organizationFields:(key,name,options)';
					break;
			}

			const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: endpoint,
			});

			const labelField = customFieldsResponse.find((field) => field.key === labelFieldName);
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
	});

export const leadlabeIdsProp = (required = false) =>
	Property.MultiSelectDropdown({
		displayName: 'Label',
		required,
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
			const customFieldsResponse = await pipedriveApiCall<{
				data: Array<{ id: string; name: string; color: string }>;
			}>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/leadLabels',
			});

			const options: DropdownOption<string>[] = [];
			for (const option of customFieldsResponse.data) {
				options.push({
					label: `${option.name} (${option.color})`,
					value: option.id,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const dealIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Deal',
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
			const options = await fetchDealsOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const productIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Product',
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
			const options = await fetchProductsOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const visibleToProp = Property.StaticDropdown({
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
});

export const leadIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Lead',
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
			const options = await fetchLeadsOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const activityTypeIdProp = (required = false) =>
	Property.Dropdown({
		displayName: 'Activity Type',
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
			const options = await fetchActivityTypesOptions(authValue);

			return {
				disabled: false,
				options,
			};
		},
	});

export const dealCommonProps = {
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
	stageId: dealStageIdProp(false),
	pipelineId: dealPipelineIdProp(false),
	ownerId: ownerIdProp('Owner', false),
	organizationId: organizationIdProp(false),
	personId: personIdProp(false),
	labelIds: labelIdsProp('deal', 'label', false),
	probability: Property.Number({
		displayName: 'Probability',
		required: false,
	}),
	expectedCloseDate: Property.DateTime({
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
	visibleTo: visibleToProp,
	customfields: customFieldsProp('deal'),
};

export const leadCommonProps = {
	ownerId: ownerIdProp('Owner', false),
	organizationId: organizationIdProp(false),
	personId: personIdProp(false),
	labelIds: leadlabeIdsProp(false),
	expectedCloseDate: Property.DateTime({
		displayName: 'Expected Close Date',
		required: false,
		description: 'Please enter date in YYYY-MM-DD format.',
	}),
	visibleTo: visibleToProp,
	channel: Property.MultiSelectDropdown({
		displayName: 'Channel',
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
	customfields: customFieldsProp('lead'),
};

export const organizationCommonProps = {
	ownerId: ownerIdProp('Owner', false),
	visibleTo: visibleToProp,
	labelIds: labelIdsProp('organization', 'label_ids', false),
	address: Property.LongText({
		displayName: 'Address',
		required: false,
	}),
	customfields: customFieldsProp('organization'),
};

export const personCommonProps = {
	ownerId: ownerIdProp('Owner', false),
	organizationId: organizationIdProp(false),
	email: Property.Array({
		displayName: 'Email',
		required: false,
	}),
	phone: Property.Array({
		displayName: 'Phone',
		required: false,
	}),
	labelIds: labelIdsProp('person', 'label_ids', false),
	firstName: Property.ShortText({
		displayName: 'First Name',
		required: false,
	}),
	lastName: Property.ShortText({
		displayName: 'Last Name',
		required: false,
	}),
	visibleTo: visibleToProp,
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
	customfields: customFieldsProp('person'),
};

export const activityCommonProps = {
	organizationId: organizationIdProp(false),
	personId: personIdProp(false),
	dealId: dealIdProp(false),
	leadId: leadIdProp(false),
	assignTo: ownerIdProp('Assign To', false),
	type: activityTypeIdProp(false),
	dueDate: Property.DateTime({
		displayName: 'Due Date',
		required: false,
		description: 'Please enter date in YYYY-MM-DD format.',
	}),
	dueTime: Property.ShortText({
		displayName: 'Due Time',
		required: false,
		description: 'Please enter time in HH:MM format.',
	}),
	duration: Property.ShortText({
		displayName: 'Duration',
		required: false,
		description: 'Please enter time in HH:MM format.',
	}),
	idDone: Property.Checkbox({
		displayName: 'Mark as Done?',
		required: false,
		defaultValue: false,
	}),
	isBusy: Property.StaticDropdown({
		displayName: 'Free or Busy',
		required: false,
		options: {
			disabled: false,
			options: [
				{
					label: 'Free',
					value: 'free',
				},
				{
					label: 'Busy',
					value: 'busy',
				},
			],
		},
	}),
	note: Property.LongText({
		displayName: 'Note',
		required: false,
	}),
	publicDescription: Property.LongText({
		displayName: 'Public Description',
		required: false,
	}),
};
