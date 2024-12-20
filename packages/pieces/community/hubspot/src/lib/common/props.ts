import {
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	PieceAuth,
	Property,
} from '@activepieces/pieces-framework';
import { hubSpotClient } from './client';
import { hubspotApiCall, HubspotFieldType } from '.';
import { HttpMethod } from '@activepieces/pieces-common';
import { HubspotProperty, HubspotPropertyGroup, WorkflowResponse } from './types';
import {
	DEFAULT_COMPANY_PROPERTIES,
	DEFAULT_CONTACT_PROPERTIES,
	DEFAULT_DEAL_PROPERTIES,
	DEFAULT_PRODUCT_PROPERTIES,
	DEFAULT_TICKET_PROPERTIES,
} from './constants';
import { Record } from '@sinclair/typebox';

export const hubSpotAuthentication = PieceAuth.OAuth2({
	authUrl: 'https://app.hubspot.com/oauth/authorize',
	tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
	required: true,
	scope: [
		'crm.lists.read',
		'crm.lists.write',
		'crm.objects.contacts.read',
		'crm.objects.contacts.write',
		'crm.objects.companies.read',
		'crm.objects.deals.read',
		'tickets',
		'forms',
	],
});

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
	return {
		disabled: true,
		options: [],
		placeholder,
	};
};

export const hubSpotListIdDropdown = Property.Dropdown<number>({
	displayName: 'List',
	refreshers: [],
	description: 'List to add contact to',
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please select an authentication',
			});
		}

		const token = (auth as OAuth2PropertyValue).access_token;
		const listsResponse = await hubSpotClient.lists.getStaticLists({ token });

		if (listsResponse.lists.length === 0) {
			return buildEmptyList({
				placeholder: 'No lists found! Please create a list.',
			});
		}

		const options = listsResponse.lists.map((list) => ({
			label: list.name,
			value: list.listId,
		}));

		return {
			disabled: false,
			options,
		};
	},
});

export function getDefaultProperties(objectType: string) {
	if (objectType === 'contact') {
		return DEFAULT_CONTACT_PROPERTIES;
	} else if (objectType === 'deal') {
		return DEFAULT_DEAL_PROPERTIES;
	} else if (objectType === 'ticket') {
		return DEFAULT_TICKET_PROPERTIES;
	} else if (objectType === 'company') {
		return DEFAULT_COMPANY_PROPERTIES;
	} else if (objectType === 'product') {
		return DEFAULT_PRODUCT_PROPERTIES;
	} else {
		return [];
	}
}

export const objectPropertiesDropdown = (objectType: string, existingProperties: string[]) =>
	Property.DynamicProperties({
		displayName: 'Object Properties',
		refreshers: [],
		required: false,
		props: async ({ auth }) => {
			if (!auth) return {};

			const props: DynamicPropsValue = {};
			const token = (auth as OAuth2PropertyValue).access_token;

			const propertiyGroupsResponse = await hubspotApiCall<{ results: HubspotPropertyGroup[] }>({
				accessToken: token,
				method: HttpMethod.GET,
				resourceUri: `/crm/v3/properties/${objectType}/groups`,
			});

			const groupFlatMap = propertiyGroupsResponse.results.reduce((map, item) => {
				map[item.name] = item.label;
				return map;
			}, {} as Record<string, string>);

			const propertiesResponse = await hubspotApiCall<{ results: HubspotProperty[] }>({
				accessToken: token,
				method: HttpMethod.GET,
				resourceUri: `/crm/v3/properties/${objectType}`,
			});

			for (const property of propertiesResponse.results) {
				if (
					existingProperties.includes(property.name) ||
					property.modificationMetadata?.readOnlyValue ||
					property.hidden
				) {
					continue;
				}

				const propertyName = `${groupFlatMap[property.groupName] ?? ''}: ${property.name}`;

				switch (property.fieldType) {
					case HubspotFieldType.BooleanCheckBox:
						props[property.name] = Property.Checkbox({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
						});
						break;
					case HubspotFieldType.Date:
						props[property.name] = Property.DateTime({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
						});
						break;
					case HubspotFieldType.Number:
						props[property.name] = Property.Number({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
						});
						break;
					case HubspotFieldType.PhoneNumber:
					case HubspotFieldType.Text:
						props[property.name] = Property.ShortText({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
						});
						break;
					case HubspotFieldType.TextArea:
					case HubspotFieldType.Html:
						props[property.name] = Property.LongText({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
						});
						break;
					case HubspotFieldType.CheckBox:
						props[property.name]=Property.StaticMultiSelectDropdown({
							displayName:propertyName,
							description:property.description ?? '',
							required:false,
							options:{
								disabled:false,
								options:property.options ? property.options.map((option) => {
									return {
										label: option.label,
										value: option.value,
									};
								}):[]
							}
						});
						break;
					case HubspotFieldType.Select:
					case HubspotFieldType.Radio:
						props[property.name] = Property.StaticDropdown({
							displayName: propertyName,
							description: property.description ?? '',
							required: false,
							options: {
								options: property.options ? property.options.map((option) => {
									return {
										label: option.label,
										value: option.value,
									};
								}):[]
							},
						});
						break;
				}
			}
			return props;
		},
	});

export const additionalPropertyToRetriveDropdown = (objectType: string) =>
	Property.MultiSelectDropdown({
		displayName: 'Additional Properties',
		refreshers: [],
		required: false,
		options: async ({ auth }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please connect your account.',
				});
			}
			const token = (auth as OAuth2PropertyValue).access_token;
			const propertiesResponse = await hubspotApiCall<{ results: HubspotProperty[] }>({
				accessToken: token,
				method: HttpMethod.GET,
				resourceUri: `/crm/v3/properties/${objectType}`,
			});

			const defaultProperties = getDefaultProperties(objectType);

			const options: DropdownOption<string>[] = [];
			for (const property of propertiesResponse.results) {
				if (defaultProperties.includes(property.name)) {
					continue;
				}
				options.push({
					label: property.label,
					value: property.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const workflowIdDropdown = Property.Dropdown({
	displayName: 'Workflow',
	refreshers: [],
	// description: 'Workflow to add contact to',
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please connect your account.',
			});
		}

		const token = (auth as OAuth2PropertyValue).access_token;
		const workflowsResponse = await hubspotApiCall<{ workflows: WorkflowResponse[] }>({
			accessToken: token,
			method: HttpMethod.GET,
			resourceUri: `/automation/v2/workflows`,
		});

		const options: DropdownOption<number>[] = [];

		for (const workflow of workflowsResponse.workflows) {
			if (workflow.enabled) {
				options.push({
					label: workflow.name,
					value: workflow.id,
				});
			}
		}

		return {
			disabled: false,
			options,
		};
	},
});
