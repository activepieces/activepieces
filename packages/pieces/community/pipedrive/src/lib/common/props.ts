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
import { context } from '@opentelemetry/api';

/**
 * Fetches options for Pipedrive filters.
 * @param auth Pipedrive authentication.
 * @param type The type of object for the filter (e.g., 'deals', 'people', 'org').
 * @returns Dropdown options for filters.
 */
export async function fetchFiltersOptions(
	auth: PiecePropValueSchema<typeof pipedriveAuth>,
	type: string,
): Promise<DropdownOption<number>[]> {
	const filters = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
		accessToken: auth.access_token,
		apiDomain: auth.data['api_domain'],
		method: HttpMethod.GET,
		resourceUri: '/v1/filters',
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

/**
 * Fetches options for Pipedrive activity types.
 * @param auth Pipedrive authentication.
 * @returns Dropdown options for activity types.
 */
export async function fetchActivityTypesOptions(
    auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<string>[]> {
    const activityTypes = await pipedriveApiCall<{
        data: Array<{ key_string: string; name: string }>;
    }>({
        accessToken: auth.access_token,
        apiDomain: auth.data['api_domain'],
        method: HttpMethod.GET,
        resourceUri: '/v1/activityTypes', 
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

/**
 * Fetches options for Pipedrive pipelines.
 * @param auth Pipedrive authentication.
 * @returns Dropdown options for pipelines.
 */
export async function fetchPipelinesOptions(
    auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
    const pipelines = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
        accessToken: auth.access_token,
        apiDomain: auth.data['api_domain'],
        method: HttpMethod.GET,
        resourceUri: '/v1/pipelines', 
    });

    const options: DropdownOption<number>[] = [];
    for (const pipeline of pipelines.data) {
        options.push({
            label: pipeline.name,
            value: pipeline.id,
        });
    }
    console.log('Fetched pipelines options:', options); // Debugging log
    return options;
}

/**
 * Fetches options for Pipedrive persons.
 * @param auth Pipedrive authentication.
 * @returns Dropdown options for persons.
 */
export async function fetchPersonsOptions(
    auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
    const persons = await pipedriveApiCall<{ data: Array<{ id: number; name: string }> }>({
        accessToken: auth.access_token,
        apiDomain: auth.data['api_domain'],
        method: HttpMethod.GET,
        resourceUri: '/v1/persons', 
        query: {
            sort_by: 'update_time', 
            sort_direction: 'desc', 
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

/**
 * Fetches options for Pipedrive users (owners).
 * @param auth Pipedrive authentication.
 * @returns Dropdown options for owners.
*/
export async function fetchOwnersOptions(
    auth: PiecePropValueSchema<typeof pipedriveAuth>,
): Promise<DropdownOption<number>[]> {
    const users = await pipedriveApiCall<{ data: Array<{ id: number; email: string }> }>({
        accessToken: auth.access_token,
        apiDomain: auth.data['api_domain'],
        method: HttpMethod.GET,
        resourceUri: '/v1/users', 
        query: {
            sort_by: 'update_time', 
            sort_direction: 'desc', 
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

/**
 * Creates a property definition for a custom field based on its Pipedrive field type.
 * @param property The Pipedrive custom field definition.
 * @returns A Property.ShortText, Property.LongText, Property.StaticDropdown, Property.StaticMultiSelectDropdown, or Property.Number.
 */
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
                                value: option.id, 
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
                                value: option.id, 
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

/**
 * Retrieves custom properties for a given Pipedrive object type.
 * @param auth Pipedrive authentication.
 * @param objectType The type of object (e.g., 'person', 'deal', 'organization', 'product', 'lead').
 * @returns Dynamic properties for custom fields.
 */
export async function retrieveObjectCustomProperties(
    auth: PiecePropValueSchema<typeof pipedriveAuth>,
    objectType: string,
) {
    let endpoint = '';

    switch (objectType) {
        case 'person':
            endpoint = '/v1/personFields'; 
            break;
        case 'deal':
           
            endpoint = '/v1/dealFields'; 
            break;
        case 'organization':
            endpoint = '/v1/organizationFields'; 
            break;
        case 'product':
            endpoint = '/v1/productFields';
            break;
        case 'lead': // Added case for lead custom fields
            endpoint = '/v1/leadFields'; 
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

/**
 * Property definition for selecting a search field for an object type.
 * @param objectType The type of object (e.g., 'deal', 'person').
 */
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
					endpoint = '/v1/personFields';
					break;
				case 'deal':
                    endpoint = '/v1/dealFields';
                    break;
				case 'lead':
					endpoint = '/v1/leadLabels';
					break;
				case 'organization':
					endpoint = '/v1/organizationFields';
					break;
				case 'product':
					endpoint = '/v1/productFields';
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
						value: field.id.toString(),
					});
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	});

/**
 * Property definition for the value of a search field.
 * Dynamically renders based on the selected searchField's type.
 * @param objectType The type of object (e.g., 'deal', 'person').
 */
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
					endpoint = '/v1/personFields';
					break;
				case 'deal':
                    endpoint= '/v1/dealFields';
                    break;
				case 'lead':
					endpoint = '/v1/leadSources';
					break;
				case 'organization':
					endpoint = '/v1/organizationFields';
					break;
				case 'product':
					endpoint = '/v1/productFields';
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
    Property.Number({
        displayName: 'Organization ID',
        description: 'You can use Find Organization action to retrieve org ID.',
        required
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
                resourceUri: '/v2/stages', 
            });

            const options: DropdownOption<number>[] = [];
            for (const stage of response) {
                
                options.push({
                    label: `${stage.name} (Pipeline ID: ${stage.pipeline_id})`, // Adjusted label as pipeline_name is removed
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
    Property.Number({
        displayName: 'Person ID',
        description: 'You can use Find Person action to retrieve person ID.',
        required
    });


export const labelIdsProp = (objectType: string, labelFieldName: string, required = false) =>
    Property.MultiSelectDropdown({
        displayName: 'Label IDs', 
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
                    endpoint = '/v1/personFields'; 
                    break;
                case 'deal':
                    endpoint = '/v1/dealFields'; 
                    break;
                case 'organization':
                    endpoint = '/v1/organizationFields'; 
                    break;
            }

            const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: endpoint,
            });

            // Find the specific label field within the custom fields response
            const labelField = customFieldsResponse.find((field) => field.key === labelFieldName);
            const options: DropdownOption<number>[] = []; 

            if (labelField && labelField.options) {
                for (const option of labelField.options) {
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


export const leadLabelIdsProp = (required = false) => 
    Property.MultiSelectDropdown({
        displayName: 'Lead Label IDs',
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
            
            const leadLabelsResponse = await pipedriveApiCall<{
                data: Array<{ id: string; name: string; color: string }>; // Lead label IDs are UUID strings in v2
            }>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v1/leadLabels', 
            });

            const options: DropdownOption<string>[] = []; // Value type is string for lead label IDs
            for (const option of leadLabelsResponse.data) {
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

export const productIdProp = (required = false) => 
    Property.Number({
        displayName: 'Product ID',
        description: 'You can use Find Product action to retrieve product ID.',
        required
    });

/**
 * Property definition for 'Visible To' setting.
 */
export const visibleToProp = Property.StaticDropdown({
    displayName: 'Visible To',
    required: false,
    options: {
        disabled: false,
        options: [
            {
                label: 'Owner & followers', 
                value: 1,
            },
            {
                label: 'Entire company', 
                value: 3,
            },
            
        ],
    },
});


export const leadIdProp = (required = false) =>
    Property.ShortText({ // Lead IDs are typically UUID strings in v2
        displayName: 'Lead ID',
        required:true,
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


export const dealIdProp = (required = false) => 
    Property.Number({
        displayName: 'Deal ID',
        description: 'You can use Find Deal action to retrieve deal ID.',
        required
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
        description: 'Please enter currency code (e.g., "USD", "EUR").',
    }),
    // REMOVED customfields from here
    visibleTo: visibleToProp,
};

/**
 * Common properties for Lead actions.
 */
export const leadCommonProps = {
    ownerId: ownerIdProp('Owner', false),
    organizationId: organizationIdProp(false),
    personId: personIdProp(false),
    labelIds: leadLabelIdsProp(false), 
    expectedCloseDate: Property.DateTime({
        displayName: 'Expected Close Date',
        required: false,
        description: 'Please enter date in YYYY-MM-DD format.',
    }),
    visibleTo: visibleToProp,
    channel: Property.Dropdown({ 
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

            const leadSourcesResponse = await pipedriveApiCall<{
                data: Array<{ id: number; name: string }>; // Lead source IDs are numbers
            }>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v1/leadSources', 
            });

            const sources = leadSourcesResponse.data ?? [];// Value type is number for lead source IDs
            const options: DropdownOption<number>[] = sources.map((source) => ({
                label: source.name ?? `Source ${source.id}`,
                value: Number(source.id),
            }));

            return {
                disabled: false,
                options,
            };
        },
    }),
    leadValue: Property.Number({
        displayName: 'Lead Value Amount', 
        required: false,
    }),
    leadValueCurrency: Property.ShortText({
        displayName: 'Lead Value Currency', 
        required: false,
        description: 'The currency of the lead value (e.g., "USD", "EUR").',
    }),
    
};

/**
 * Common properties for Organization actions.
 */
export const organizationCommonProps = {
    ownerId: ownerIdProp('Owner', false),
    visibleTo: visibleToProp,
    labelIds: labelIdsProp('organization', 'label_ids', false), 
    address: Property.LongText({ 
        displayName: 'Address',
        required: false,
        description: 'For structured address, the action will need to parse this string into the v2 address object format.'
    }),
    
};


export const personCommonProps = {
    ownerId: ownerIdProp('Owner', false),
    organizationId: organizationIdProp(false),
    email: Property.Array({
        displayName: 'Email',
        required: false,
        description: 'Enter email addresses as a comma-separated list of strings.'
    }),
    phone: Property.Array({
        displayName: 'Phone',
        required: false,
        description: 'Enter phone numbers as a comma-separated list of strings.'
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
        description: 'Please enter time in HH:MM format (e.g., "01:30" for 1 hour 30 minutes).',
    }),
    isDone: Property.Checkbox({ 
        displayName: 'Mark as Done?',
        required: false,
        defaultValue: false,
    }),
    busy: Property.StaticDropdown({ 
        displayName: 'Free or Busy',
        required: false,
        options: {
            disabled: false,
            options: [
                {
                    label: 'Free',
                    value: false,
                },
                {
                    label: 'Busy',
                    value: true,
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

// Helper function for custom fields property definition
export function customFieldsProp(objectType: string) { 
    return Property.DynamicProperties({
        displayName: 'Custom Fields',
        required: false,
        refreshers: [],
        props: async ({ auth }) => {
            if (!auth) return {};
            const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
            return await retrieveObjectCustomProperties(authValue, objectType);
        },
    });
}
