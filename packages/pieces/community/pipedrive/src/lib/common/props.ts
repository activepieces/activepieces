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
        resourceUri: '/v2/filters', // ✅ Updated to v2 endpoint
        query: {
            type: type,
        },
    });

    const options: DropdownOption<number>[] = [];
    for (const filter of filters.data) {
        options.push({
            label: filter.name,
            value: filter.id, // ✅ Filter IDs are numbers
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
        resourceUri: '/v2/activityTypes', // ✅ Updated to v2 endpoint, removed field selector
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
        resourceUri: '/v2/pipelines', // ✅ Updated to v2 endpoint, removed field selector
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
        resourceUri: '/v2/persons', // ✅ Updated to v2 endpoint, removed field selector
        query: {
            sort_by: 'update_time', // ✅ Updated sorting parameter for v2
            sort_direction: 'desc', // ✅ Added sorting direction for v2
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
        resourceUri: '/v2/users', // ✅ Updated to v2 endpoint, removed field selector
        query: {
            sort_by: 'update_time', // ✅ Updated sorting parameter for v2
            sort_direction: 'desc', // ✅ Added sorting direction for v2
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
        case 'address': // Address fields in v2 are objects, but if input is a single string, LongText is acceptable.
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
                                value: option.id, // ✅ Value is now number for enum/set options in v2
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
                                value: option.id, // ✅ Value is now number for enum/set options in v2
                            };
                        })
                        : [],
                },
            });
        case 'double':
        case 'monetary': // Monetary fields in v2 are objects, but this defines input for the amount.
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
            endpoint = '/v2/personFields'; // ✅ Updated to v2 endpoint
            break;
        case 'deal':
            // Pipedrive v2 migration guide suggests 'leadFields' for leads, but actions often use 'dealFields' for deals.
            // If lead-specific custom fields are needed, a separate 'leadFields' endpoint should be used.
            endpoint = '/v2/dealFields'; // ✅ Updated to v2 endpoint.
            break;
        case 'organization':
            endpoint = '/v2/organizationFields'; // ✅ Updated to v2 endpoint
            break;
        case 'product':
            endpoint = '/v2/productFields'; // ✅ Updated to v2 endpoint
            break;
        case 'lead': // Added case for lead custom fields
            endpoint = '/v2/leadFields'; // ✅ Pipedrive v2 has a dedicated endpoint for lead fields
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
                    endpoint = '/v2/personFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'deal':
                    endpoint = '/v2/dealFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'organization':
                    endpoint = '/v2/organizationFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'product':
                    endpoint = '/v2/productFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'lead':
                    endpoint = '/v2/leadFields'; // ✅ Updated to v2 endpoint
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
                // In v2, field.key is the key to use for search, and it's a string.
                if (!isNil(field.key)) { // Use field.key for the value, as it's the identifier for search
                    options.push({
                        label: field.name,
                        value: field.key, // ✅ Use field.key for the value
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
                    endpoint = '/v2/personFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'deal':
                    endpoint = '/v2/dealFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'organization':
                    endpoint = '/v2/organizationFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'product':
                    endpoint = '/v2/productFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'lead':
                    endpoint = '/v2/leadFields'; // ✅ Updated to v2 endpoint
                    break;
            }

            // Fetch the specific field definition to determine its type
            const response = await pipedriveApiCall<{ data: GetField }>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `${endpoint}/${searchField}`, // searchField is the field.key
            });

            const propertyDefinition =
                // For 'set' (MultiSelectDropdown), Pipedrive search uses a single value for exact match.
                // The migration guide suggests 'exact' for match parameter, but for dropdowns,
                // it's usually the ID. Keeping it as StaticDropdown for single selection.
                response.data.field_type === 'set' || response.data.field_type === 'enum' // Also apply to enum for consistency
                    ? Property.StaticDropdown({
                        displayName: response.data.name,
                        required: false,
                        options: {
                            disabled: false,
                            options: response.data.options
                                ? response.data.options.map((option) => {
                                    return {
                                        label: option.label,
                                        value: option.id, // ✅ Value is now number for enum/set options in v2
                                    };
                                })
                                : [],
                        },
                    })
                    : createPropertyDefinition(response.data); // Use existing helper for other types

            if (propertyDefinition) {
                props['field_value'] = propertyDefinition;
            } else {
                // Fallback for types not explicitly handled by createPropertyDefinition
                props['field_value'] = Property.ShortText({
                    displayName: response.data.name,
                    required: false,
                });
            }
            return props;
        },
    });

/**
 * Property definition for selecting an owner (user ID).
 * @param displayName The display name for the property.
 * @param required Whether the property is required.
 */
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

/**
 * Property definition for selecting a filter ID.
 * @param type The type of object for the filter.
 * @param required Whether the property is required.
 */
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

/**
 * Property definition for an Organization ID.
 * @param required Whether the property is required.
 */
export const organizationIdProp = (required = false) =>
    Property.Number({
        displayName: 'Organization ID',
        description: 'You can use Find Organization action to retrieve org ID.',
        required
    });

/**
 * Property definition for a Deal Pipeline ID.
 * @param required Whether the property is required.
 */
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

/**
 * Property definition for a Deal Stage ID.
 * @param required Whether the property is required.
 */
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
            // In v2, pipeline_name is removed from the stage object, so we need to fetch it separately
            // if we want to display it in the label. For simplicity, we can just display the stage name.
            const response = await pipedrivePaginatedApiCall<StageWithPipelineInfo>({ // StageWithPipelineInfo might need update
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/stages', // ✅ Updated to v2 endpoint
            });

            const options: DropdownOption<number>[] = [];
            for (const stage of response) {
                // In v2, stage object still has 'pipeline_id' but 'pipeline_name' is removed.
                // To show pipeline name, you'd need to fetch pipelines separately and map.
                // For now, just using stage.name.
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

/**
 * Property definition for a Person ID.
 * @param required Whether the property is required.
 */
export const personIdProp = (required = false) =>
    Property.Number({
        displayName: 'Person ID',
        description: 'You can use Find Person action to retrieve person ID.',
        required
    });

/**
 * Property definition for selecting label IDs.
 * @param objectType The type of object (e.g., 'person', 'deal', 'organization').
 * @param labelFieldName The specific field key for labels (e.g., 'label_ids').
 * @param required Whether the property is required.
 */
export const labelIdsProp = (objectType: string, labelFieldName: string, required = false) =>
    Property.MultiSelectDropdown({
        displayName: 'Label IDs', // Changed from 'Label' to 'Label IDs' for clarity
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
                    endpoint = '/v2/personFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'deal':
                    endpoint = '/v2/dealFields'; // ✅ Updated to v2 endpoint
                    break;
                case 'organization':
                    endpoint = '/v2/organizationFields'; // ✅ Updated to v2 endpoint
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
            const options: DropdownOption<number>[] = []; // Options should be numbers for label IDs

            if (labelField && labelField.options) {
                for (const option of labelField.options) {
                    options.push({
                        label: option.label,
                        value: option.id, // ✅ Value is now a number for label IDs in v2
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
 * Property definition for Lead Label IDs.
 * @param required Whether the property is required.
 */
export const leadLabelIdsProp = (required = false) => // Renamed to leadLabelIdsProp for consistency
    Property.MultiSelectDropdown({
        displayName: 'Lead Label IDs', // Changed from 'Label' to 'Lead Label IDs' for clarity
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
            // ✅ In v2, lead labels are fetched from /v2/leadLabels
            const leadLabelsResponse = await pipedriveApiCall<{
                data: Array<{ id: string; name: string; color: string }>; // Lead label IDs are UUID strings in v2
            }>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/leadLabels', // ✅ Updated to v2 endpoint
            });

            const options: DropdownOption<string>[] = []; // Value type is string for lead label IDs
            for (const option of leadLabelsResponse.data) {
                options.push({
                    label: `${option.name} (${option.color})`,
                    value: option.id, // ✅ Lead label IDs are strings (UUIDs) in v2
                });
            }

            return {
                disabled: false,
                options,
            };
        },
    });

/**
 * Property definition for a Product ID.
 * @param required Whether the property is required.
 */
export const productIdProp = (required = false) => // ✅ ADDED export here
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
                label: 'Owner & followers', // Pipedrive v2 description
                value: 1,
            },
            {
                label: 'Entire company', // Pipedrive v2 description
                value: 3,
            },
            // Pipedrive v2 also has values 5 (Owner's visibility group) and 7 (Owner's visibility group and sub-groups) for Premium/Ultimate plans.
            // You might consider adding these if relevant for your users.
        ],
    },
});

/**
 * Property definition for a Lead ID.
 * @param required Whether the property is required.
 */
export const leadIdProp = (required = false) =>
    Property.ShortText({ // Lead IDs are typically UUID strings in v2
        displayName: 'Lead ID',
        required,
    });

/**
 * Property definition for an Activity Type ID.
 * @param required Whether the property is required.
 */
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

/**
 * Property definition for a Deal ID.
 * This is now a function that returns a Property.Number, to be consistent with other ID props.
 * @param required Whether the property is required.
 */
export const dealIdProp = (required = false) => // ✅ Re-defined as a function
    Property.Number({
        displayName: 'Deal ID',
        description: 'You can use Find Deal action to retrieve deal ID.',
        required
    });


/**
 * Common properties for Deal actions.
 * Renamed from `dealIdProp` to `dealCommonProps` to avoid conflict.
 */
export const dealCommonProps = { // ✅ Renamed to dealCommonProps
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
                    label: 'Deleted', // In v2, 'deleted' is a valid status for filtering
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
    labelIds: labelIdsProp('deal', 'label', false), // ✅ Using the dedicated labelIdsProp
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
    labelIds: leadLabelIdsProp(false), // ✅ Using the dedicated leadLabelIdsProp
    expectedCloseDate: Property.DateTime({
        displayName: 'Expected Close Date',
        required: false,
        description: 'Please enter date in YYYY-MM-DD format.',
    }),
    visibleTo: visibleToProp,
    channel: Property.Dropdown({ // Changed from MultiSelectDropdown to Dropdown as channel is single select
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
            // ✅ Fetching lead sources from /v2/leadSources as per Pipedrive API v2 documentation
            const leadSourcesResponse = await pipedriveApiCall<{
                data: Array<{ id: number; name: string }>; // Lead source IDs are numbers
            }>({
                accessToken: authValue.access_token,
                apiDomain: authValue.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/leadSources', // ✅ Updated to v2 endpoint for lead sources
            });

            const options: DropdownOption<number>[] = []; // Value type is number for lead source IDs
            for (const source of leadSourcesResponse.data) {
                options.push({
                    label: source.name,
                    value: source.id,
                });
            }

            return {
                disabled: false,
                options,
            };
        },
    }),
    leadValue: Property.Number({
        displayName: 'Lead Value Amount', // Clarified display name
        required: false,
    }),
    leadValueCurrency: Property.ShortText({
        displayName: 'Lead Value Currency', // Clarified display name
        required: false,
        description: 'The currency of the lead value (e.g., "USD", "EUR").',
    }),
    // REMOVED customfields from here
};

/**
 * Common properties for Organization actions.
 */
export const organizationCommonProps = {
    ownerId: ownerIdProp('Owner', false),
    visibleTo: visibleToProp,
    labelIds: labelIdsProp('organization', 'label_ids', false), // ✅ Using the dedicated labelIdsProp
    address: Property.LongText({ // If structured address input is desired, this should be Property.Object
        displayName: 'Address',
        required: false,
        description: 'For structured address, the action will need to parse this string into the v2 address object format.'
    }),
    // REMOVED customfields from here
};

/**
 * Common properties for Person actions.
 */
export const personCommonProps = {
    ownerId: ownerIdProp('Owner', false),
    organizationId: organizationIdProp(false),
    // In v2, phone and email are arrays of objects, not just string arrays.
    // The actions will need to map these to the correct format.
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
    // REMOVED customfields from here
};

/**
 * Common properties for Activity actions.
 */
export const activityCommonProps = {
    organizationId: organizationIdProp(false),
    personId: personIdProp(false),
    dealId: dealIdProp(false), // ✅ Now correctly calling the dealIdProp function
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
        description: 'Please enter time in HH:MM format (e.g., "01:30" for 1 hour 30 minutes).', // Clarified format
    }),
    isDone: Property.Checkbox({ // Renamed to 'isDone' for clarity and consistency with boolean type
        displayName: 'Mark as Done?',
        required: false,
        defaultValue: false,
    }),
    busy: Property.StaticDropdown({ // Renamed from 'isBusy' to 'busy' for consistency with API field
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
export function customFieldsProp(objectType: string) { // ✅ Exported the helper
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
