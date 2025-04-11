import {
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { WorkflowResponse, HubspotProperty, HubspotFieldType, ListBlogsResponse } from './types';
import {
	DEFAULT_COMPANY_PROPERTIES,
	DEFAULT_CONTACT_PROPERTIES,
	DEFAULT_DEAL_PROPERTIES,
	DEFAULT_LINE_ITEM_PROPERTIES,
	DEFAULT_PRODUCT_PROPERTIES,
	DEFAULT_TICKET_PROPERTIES,
	DEFAULT_TASK_PROPERTIES,
	OBJECT_TYPE,
	STANDARD_OBJECT_TYPES,
} from './constants';
import { Client } from '@hubspot/api-client';
import { hubspotAuth } from '../../';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
	return {
		disabled: true,
		options: [],
		placeholder,
	};
};

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
		case OBJECT_TYPE.LINE_ITEM:
			return DEFAULT_LINE_ITEM_PROPERTIES;
		case OBJECT_TYPE.TASK:
			return DEFAULT_TASK_PROPERTIES;
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

async function fetchCurrenciesOptions(accessToken: string): Promise<DropdownOption<string>[]> {
	const options: DropdownOption<string>[] = [];

	const response = await httpClient.sendRequest<{
		results: Array<{ currencyCode: string; currencyName: string }>;
	}>({
		method: HttpMethod.GET,
		url: 'https://api.hubapi.com/settings/v3/currencies/codes',
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
	});
	for (const currency of response.body.results) {
		options.push({
			label: currency.currencyName,
			value: currency.currencyCode,
		});
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
			return Property.StaticDropdown({
				displayName: propertyDisplayName,
				required: true,
				defaultValue:'',
				options:{
					disabled:false,
					options:[
						{
							label:'Yes',
							value:'true'
						},
						{
							label:'No',
							value:'false'
						},
						{
							label:"Unanswered",
							value:''
						}
					]
				}
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

async function retrieveObjectProperties(
	auth: PiecePropValueSchema<typeof hubspotAuth>,
	objectType: string,
	excludedProperties: string[] = [],
) {
	const client = new Client({ accessToken: auth.access_token });

	// Fetch property groups
	const propertyGroups = await client.crm.properties.groupsApi.getAll(objectType);
	const groupLabels = propertyGroups.results.reduce((map, group) => {
		map[group.name] = group.label;
		return map;
	}, {} as Record<string, string>);

	// Fetch all properties for the given object type
	const allProperties = await client.crm.properties.coreApi.getAll(objectType);

	const props: DynamicPropsValue = {};

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
				auth.access_token,
			);
			continue;
		}
		if (property.name === 'hs_shared_user_ids') {
			const userOptions = await fetchUsersOptions(auth.access_token);
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
		if (['hs_shared_team_ids', 'hs_attributed_team_ids'].includes(property.name)) {
			const teamOptions = await fetchTeamsOptions(auth.access_token);
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
		if (property.name === 'deal_currency_code') {
			const currencyOptions = await fetchCurrenciesOptions(auth.access_token);
			props[property.name] = Property.StaticDropdown({
				displayName: propertyDisplayName,
				required: false,
				options: {
					disabled: false,
					options: currencyOptions,
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
}

export const standardObjectDynamicProperties = (objectType: string, excludedProperties: string[]) =>
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
			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			return await retrieveObjectProperties(authValue, objectType, excludedProperties);
		},
	});

export const customObjectDynamicProperties = Property.DynamicProperties({
	displayName: 'Custom Object Properties',
	refreshers: ['customObjectType'],
	required: false,
	props: async ({ auth, customObjectType }) => {
		if (!auth || !customObjectType) {
			return {};
		}
		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		return await retrieveObjectProperties(authValue, customObjectType as unknown as string);
	},
});

export const standardObjectPropertiesDropdown = (
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

export const customObjectPropertiesDropdown = (
	displayName: string,
	required: boolean,
	isSingleSelect = false,
) =>
	Property.DynamicProperties({
		displayName,
		refreshers: ['customObjectType'],
		required,
		props: async ({ auth, customObjectType }) => {
			if (!auth || !customObjectType) {
				return {};
			}
			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;

			const client = new Client({ accessToken: authValue.access_token });

			// Fetch all properties for the given object type
			const allProperties = await client.crm.properties.coreApi.getAll(
				customObjectType as unknown as string,
			);

			const propertyGroups = await client.crm.properties.groupsApi.getAll(
				customObjectType as unknown as string,
			);

			const groupLabels = propertyGroups.results.reduce((map, group) => {
				map[group.name] = group.label;
				return map;
			}, {} as Record<string, string>);

			const options: DropdownOption<string>[] = [];
			for (const property of allProperties.results) {
				const propertyDisplayName = `${groupLabels[property.groupName] || ''}: ${property.label}`;
				options.push({
					label: propertyDisplayName,
					value: property.name,
				});
			}

			const props: DynamicPropsValue = {};
			const dropdownFunction = isSingleSelect
				? Property.StaticDropdown
				: Property.StaticMultiSelectDropdown;

			props['values'] = dropdownFunction({
				displayName,
				required,
				options: {
					disabled: false,
					options,
				},
			});
			return props;
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
		const workflowsResponse = await httpClient.sendRequest<{
			workflows: WorkflowResponse[];
		}>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/automation/v2/workflows`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: token,
			},
		});
		const options: DropdownOption<number>[] = [];

		for (const workflow of workflowsResponse.body.workflows) {
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

export const productDropdown = (params: DropdownParams) =>
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

			const options: DropdownOption<string>[] = [];

			const limit = 100;
			let after: string | undefined;
			do {
				const response = await client.crm.products.basicApi.getPage(limit, after, ['name']);
				for (const product of response.results) {
					options.push({
						label: product.properties.name ?? product.id,
						value: product.id,
					});
				}

				after = response.paging?.next?.after;
			} while (after);

			return {
				disabled: false,
				options,
			};
		},
	});
export const customObjectDropdown = Property.Dropdown({
	displayName: 'Type of Custom Object',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please connect your account.',
			});
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		const client = new Client({ accessToken: authValue.access_token });

		const customObjectsResponse = await client.crm.schemas.coreApi.getAll();

		const options = customObjectsResponse.results.map((customObj) => {
			return {
				label: customObj.labels.plural ?? customObj.name,
				value: customObj.objectTypeId,
			};
		});

		return {
			disabled: false,
			options,
		};
	},
});

export const staticListsDropdown = Property.Dropdown({
	displayName: 'List ID',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please connect your account.',
			});
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		const options: DropdownOption<number>[] = [];

		let offset = 0;
		let hasMore = true;
		do {
			const request: HttpRequest = {
				url: 'https://api.hubapi.com/contacts/v1/lists/static',
				method: HttpMethod.GET,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
				queryParams: {
					count: '100',
					offset: offset.toString(),
				},
			};
			const response = await httpClient.sendRequest<{
				total: number;
				offset: number;
				'has-more': boolean;
				lists: Array<{ name: string; listId: number }>;
			}>(request);

			for (const list of response.body.lists) {
				options.push({
					label: list.name,
					value: list.listId,
				});
			}
			offset += 100;
			hasMore = response.body['has-more'];
		} while (hasMore);

		return {
			disabled: false,
			options,
		};
	},
});

export const fromObjectTypeAssociationDropdown = (params: DropdownParams) =>
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

			const customObjectsResponse = await client.crm.schemas.coreApi.getAll();

			//
			const options = customObjectsResponse.results.map((customObj) => {
				return {
					label: customObj.labels.plural ?? customObj.name,
					value: customObj.objectTypeId,
				};
			});
			return {
				disabled: false,
				options: [...STANDARD_OBJECT_TYPES, ...options],
			};
		},
	});

export const associationTypeDropdown = Property.Dropdown({
	displayName: 'Type of the association',
	refreshers: ['fromObjectType', 'toObjectType'],
	required: true,
	options: async ({ auth, fromObjectType, toObjectType }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please connect your account.',
			});
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		const client = new Client({ accessToken: authValue.access_token });
		const associationLabels = await client.crm.associations.v4.schema.definitionsApi.getAll(
			fromObjectType as string,
			toObjectType as string,
		);

		const options = associationLabels.results.map((associationLabel) => {
			return {
				label: associationLabel.label ?? `${fromObjectType}_to_${toObjectType}`,
				value: associationLabel.typeId,
			};
		});

		return {
			disabled: false,
			options,
		};
	},
});

export const toObjectIdsDropdown = (params: DropdownParams) =>
	Property.MultiSelectDropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: ['toObjectType'],
		required: params.required,
		options: async ({ auth, toObjectType }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please connect your account.',
				});
			}

			const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
			const client = new Client({ accessToken: authValue.access_token });

			const limit = 100;
			const options: DropdownOption<string>[] = [];
			let after: string | undefined;
			do {
				const response = await client.crm.objects.basicApi.getPage(
					toObjectType as string,
					limit,
					after,
				);
				for (const object of response.results) {
					let labelName;
					switch (toObjectType) {
						case OBJECT_TYPE.CONTACT:
							labelName = 'email';
							break;
						case OBJECT_TYPE.COMPANY:
							labelName = 'name';
							break;
						case OBJECT_TYPE.DEAL:
							labelName = 'dealname';
							break;
						case OBJECT_TYPE.TICKET:
							labelName = 'subject';
							break;
						case OBJECT_TYPE.LINE_ITEM:
							labelName = 'name';
							break;
					}
					options.push({
						label: object.properties[labelName!] ?? object.id,
						value: object.id,
					});
				}
				after = response.paging?.next?.after;
			} while (after);

			return {
				disabled: false,
				options,
			};
		},
	});

export const formDropdown = Property.Dropdown({
	displayName: 'Form',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please connect your account.',
			});
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		const client = new Client({ accessToken: authValue.access_token });

		const limit = 100;
		const options: DropdownOption<string>[] = [];

		let after: string | undefined;
		do {
			const response = await client.marketing.forms.formsApi.getPage(after, limit);
			for (const form of response.results) {
				options.push({
					label: form.name,
					value: form.id,
				});
			}
			after = response.paging?.next?.after;
		} while (after);

		return {
			disabled: false,
			options,
		};
	},
});

export const blogUrlDropdown = Property.Dropdown({
	displayName: 'Blog URL',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, options: [], placeholder: 'Please connect your account.' };
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;

		const response = await httpClient.sendRequest<ListBlogsResponse>({
			method: HttpMethod.GET,
			url: 'https://api.hubapi.com/content/api/v2/blogs',
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: authValue.access_token },
			queryParams: {
				limit: '100',
			},
		});

		return {
			disabled: false,
			options: response.body.objects.map((blog) => {
				return {
					label: blog.absolute_url,
					value: blog.id.toString(),
				};
			}),
		};
	},
});

export const blogAuthorDropdown = Property.Dropdown({
	displayName: 'Blog Author',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, options: [], placeholder: 'Please connect your account.' };
		}

		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;

		const client = new Client({ accessToken: authValue.access_token });

		const options: DropdownOption<string>[] = [];

		let after: string | undefined;
		do {
			const response = await client.cms.blogs.authors.blogAuthorsApi.getPage(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				after,
				100,
			);
			for (const author of response.results) {
				options.push({
					label: author.name,
					value: author.id,
				});
			}

			after = response.paging?.next?.after;
		} while (after);

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

export const 	pageType=Property.StaticDropdown({
	displayName:'Page Type',
	required:true,
	defaultValue:'landing_page',
	options:{
		disabled:false,
		options:[
			{
				label:'Landing Page',
				value:'landing_page'
			},
			{
				label:'Site Page',
				value:'site_page'
			}
		]
	}
})