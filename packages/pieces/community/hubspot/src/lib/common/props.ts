import {
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	PieceAuth,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { hubSpotClient } from './client';
import { hubspotApiCall, HubspotFieldType } from '.';
import { HttpMethod } from '@activepieces/pieces-common';
import { WorkflowResponse, HubspotProperty } from './types';
import {
	DEFAULT_COMPANY_PROPERTIES,
	DEFAULT_CONTACT_PROPERTIES,
	DEFAULT_DEAL_PROPERTIES,
	DEFAULT_PRODUCT_PROPERTIES,
	DEFAULT_TICKET_PROPERTIES,
	OBJECT_TYPE,
} from './constants';
import { Client } from '@hubspot/api-client';
import { hubspotAuth } from '../../';

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

export function getDefaultPropertiesForObject(objectType: OBJECT_TYPE): string[] {
	switch (objectType) {
		case OBJECT_TYPE.CONTACT:
			return DEFAULT_CONTACT_PROPERTIES;
		case OBJECT_TYPE.DEAL:
			return DEFAULT_DEAL_PROPERTIES;
		case OBJECT_TYPE.TICKET:
			return DEFAULT_TICKET_PROPERTIES;
		case OBJECT_TYPE.COMPANY:
			return DEFAULT_COMPANY_PROPERTIES;
		case OBJECT_TYPE.PRODUCT:
			return DEFAULT_PRODUCT_PROPERTIES;
		default:
			return [];
	}
}

async function fetchOwnersOptions(accessToken: string): Promise<DropdownOption<string>[]> {
	const client = new Client({ accessToken: accessToken });
	const limit = 100;
	const options: DropdownOption<string>[] = [];

	let after: string | undefined;
	do {
		const response = await client.crm.owners.ownersApi.getPage(undefined, after, limit);
		for (const owner of response.results)
			if (owner.email) {
				options.push({
					label: owner.email,
					value: owner.id,
				});
			}
		after = response.paging?.next?.after;
	} while (after);
	return options;
}

async function fetchUsersOptions(accessToken: string): Promise<DropdownOption<string>[]> {
	const client = new Client({ accessToken: accessToken });
	const limit = 100;
	const options: DropdownOption<string>[] = [];

	let after: string | undefined;
	do {
		const response = await client.settings.users.usersApi.getPage(limit, after);
		for (const user of response.results) {
			if (user.email) {
				options.push({
					label: user.email,
					value: user.id,
				});
			}
		}
		after = response.paging?.next?.after;
	} while (after);
	return options;
}

async function fetchTeamsOptions(accessToken: string): Promise<DropdownOption<string>[]> {
	const client = new Client({ accessToken: accessToken });
	const options: DropdownOption<string>[] = [];

	const response = await client.settings.users.teamsApi.getAll();
	for (const team of response.results) {
		if (team.name) {
			options.push({
				label: team.name,
				value: team.id,
			});
		}
	}
	return options;
}

// async function fetchBusinessUnitsOptions(accessToken: string): Promise<DropdownOption<string>[]> {
// 	const client = new Client({ accessToken: accessToken });
// 	const options: DropdownOption<string>[] = [];

// 	const response = await client.settings.businessUnits.businessUnitApi.getByUserID()
// 	for (const businessUnit of response.results) {
// 		if (businessUnit.name) {
// 			options.push({
// 				label: businessUnit.name,
// 				value: businessUnit.id,
// 			});
// 		}
// 	}
// 	return options;
// }

async function createReferencedPropertyDefinition(
	property: HubspotProperty,
	propertyDisplayName: string,
	accessToken: string,
) {
	let options: DropdownOption<string>[] = [];

	switch (property.referencedObjectType) {
		case 'OWNER':
			options = await fetchOwnersOptions(accessToken);
			break;
		default:
			return null;
	}

	return Property.StaticDropdown({
		displayName: propertyDisplayName,
		required: false,
		options: {
			disabled: false,
			options,
		},
	});
}

function createPropertyDefinition(property: HubspotProperty, propertyDisplayName: string) {
	switch (property.fieldType) {
		case HubspotFieldType.BooleanCheckBox:
			return Property.Checkbox({
				displayName: propertyDisplayName,
				required: false,
			});
		case HubspotFieldType.Date:
			return Property.DateTime({
				displayName: propertyDisplayName,
				description: property.type === 'date' ? 'Provide date in YYYY-MM-DD format' : '',
				required: false,
			});
		case HubspotFieldType.Number:
			return Property.Number({
				displayName: propertyDisplayName,
				required: false,
			});
		case HubspotFieldType.PhoneNumber:
		case HubspotFieldType.Text:
			return Property.ShortText({
				displayName: propertyDisplayName,
				required: false,
			});
		case HubspotFieldType.TextArea:
		case HubspotFieldType.Html:
			return Property.LongText({
				displayName: propertyDisplayName,
				required: false,
			});
		case HubspotFieldType.CheckBox:
			return Property.StaticMultiSelectDropdown({
				displayName: propertyDisplayName,
				required: false,
				options: {
					disabled: false,
					options: property.options
						? property.options.map((option) => {
								return {
									label: option.label,
									value: option.value,
								};
						  })
						: [],
				},
			});
		case HubspotFieldType.Select:
		case HubspotFieldType.Radio:
			return Property.StaticDropdown({
				displayName: propertyDisplayName,
				required: false,
				options: {
					options: property.options
						? property.options.map((option) => {
								return {
									label: option.label,
									value: option.value,
								};
						  })
						: [],
				},
			});
		default:
			return null;
	}
}

export const objectPropertiesDropdown = (objectType: string, excludedProperties: string[]) =>
	Property.DynamicProperties({
		displayName: 'Object Properties',
		refreshers: [],
		required: false,
		props: async ({ auth }) => {
			if (!auth) return {};
			// Useful for Find actions
			// if (typeof createIfNotExists === "boolean" && createIfNotExists === false) {
			// 	return {};
			// }

			const props: DynamicPropsValue = {};
			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			const client = new Client({ accessToken: authValue.access_token });

			const propertyGroups = await client.crm.properties.groupsApi.getAll(objectType);

			const groupLabels = propertyGroups.results.reduce((map, group) => {
				map[group.name] = group.label;
				return map;
			}, {} as Record<string, string>);

			const allProperties = await client.crm.properties.coreApi.getAll(objectType);

			for (const property of allProperties.results) {
				// skip read only properties
				if (
					excludedProperties.includes(property.name) ||
					property.modificationMetadata?.readOnlyValue ||
					property.hidden
				) {
					continue;
				}

				// create property name with property group name
				const propertyDisplayName = `${groupLabels[property.groupName] || ''}: ${property.label}`;

				if (property.referencedObjectType) {
					props[property.name] = await createReferencedPropertyDefinition(
						property,
						propertyDisplayName,
						authValue.access_token,
					);
					continue;
				}
				if (property.name === 'hs_shared_user_ids') {
					const userOptions = await fetchUsersOptions(authValue.access_token);
					props[property.name] = Property.StaticMultiSelectDropdown({
						displayName: propertyDisplayName,
						required: false,
						options: {
							disabled: false,
							options: userOptions,
						},
					});
					continue;
				}
				if (property.name === 'hs_shared_team_ids') {
					const teamOptions = await fetchTeamsOptions(authValue.access_token);
					props[property.name] = Property.StaticMultiSelectDropdown({
						displayName: propertyDisplayName,
						required: false,
						options: {
							disabled: false,
							options: teamOptions,
						},
					});
					continue;
				}
				if (property.name === 'hs_all_assigned_business_unit_ids') {
					// TO DO : Add business unit options
					// const businessUnitOptions = await fetchBusinessUnitsOptions(authValue.access_token);
					// props[property.name] = Property.StaticMultiSelectDropdown({
					// 	displayName: propertyDisplayName,
					// 	required: false,
					// 	options: {
					// 		disabled: false,
					// 		options: businessUnitOptions,
					// 	},
					// });
					continue;
				}

				props[property.name] = createPropertyDefinition(property, propertyDisplayName);
			}
			// Remove null props
			return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
		},
	});

export const propertiesDropdown = (
	params: DropdownParams,
	includeDefaultProperties = false,
	isSingleSelect = false,
) => {
	const dropdownFunction = isSingleSelect ? Property.Dropdown : Property.MultiSelectDropdown;
	return dropdownFunction({
		displayName: params.displayName,
		refreshers: [],
		required: params.required,
		description: params.description,
		options: async ({ auth }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please connect your account.',
				});
			}
			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			const client = new Client({ accessToken: authValue.access_token });

			// Fetch all properties for the given object type
			const allProperties = await client.crm.properties.coreApi.getAll(params.objectType);

			const propertyGroups = await client.crm.properties.groupsApi.getAll(params.objectType);

			const groupLabels = propertyGroups.results.reduce((map, group) => {
				map[group.name] = group.label;
				return map;
			}, {} as Record<string, string>);

			const defaultProperties = includeDefaultProperties
				? []
				: getDefaultPropertiesForObject(params.objectType);

			// Filter and create options for properties that are not default
			const options: DropdownOption<string>[] = [];
			for (const property of allProperties.results) {
				if (!includeDefaultProperties && defaultProperties.includes(property.name)) {
					continue;
				}
				const propertyDisplayName = `${groupLabels[property.groupName] || ''}: ${property.label}`;
				options.push({
					label: propertyDisplayName,
					value: property.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});
};

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

export const pipelineDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		refreshers: [],
		required: params.required,
		description: params.description,
		options: async ({ auth }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please connect your account.',
				});
			}

			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			const client = new Client({ accessToken: authValue.access_token });

			const pipelinesResponse = await client.crm.pipelines.pipelinesApi.getAll(params.objectType);

			const options = pipelinesResponse.results.map((pipeline) => {
				return {
					label: pipeline.label,
					value: pipeline.id,
				};
			});
			return {
				disabled: false,
				options,
			};
		},
	});

export const pipelineStageDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		refreshers: ['pipelineId'],
		required: params.required,
		description: params.description,
		options: async ({ auth, pipelineId }) => {
			if (!auth || !pipelineId) {
				return buildEmptyList({
					placeholder: 'Please connect your account and select a pipeline.',
				});
			}

			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			const client = new Client({ accessToken: authValue.access_token });

			const pipelineStagesResponse = await client.crm.pipelines.pipelineStagesApi.getAll(
				params.objectType,
				pipelineId as string,
			);

			const options = pipelineStagesResponse.results.map((stage) => {
				return {
					label: stage.label,
					value: stage.id,
				};
			});

			return {
				disabled: false,
				options,
			};
		},
	});

type DropdownParams = {
	objectType: OBJECT_TYPE;
	displayName: string;
	required: boolean;
	description?: string;
};
