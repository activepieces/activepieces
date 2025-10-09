import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const createFeature = createAction({
    name: 'create_feature',
    displayName: 'Create Feature',
    description: 'Create a new feature in Productboard',
    auth: productboardAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Feature Name',
            description: 'Name of the feature',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the feature',
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: 'Type of the feature',
            required: true,
            options: {
                options: [
                    { label: 'Feature', value: 'feature' },
                    { label: 'Subfeature', value: 'subfeature' },
                ]
            }
        }),
        status: Property.Dropdown({
            displayName: 'Status',
            description: 'Current status of the feature',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first'
                    };
                }
                const response = await productboardCommon.apiCall({
                    auth: auth as string,
                    method: HttpMethod.GET,
                    resourceUri: '/feature-statuses'
                });
                const statuses = response.body['data'] ?? [];
                return {
                    disabled: false,
                    options: statuses.map((status: { id: string; name: string }) => ({
                        label: status.name,
                        value: status.id
                    }))
                };
            }
        }),
        parent_type: Property.DynamicProperties({
            displayName: 'Parent Type',
            required: true,
            refreshers: ['type'],
            props: async (props) => {
                const typeValue = props['type'] as unknown as string
                const fields: { [key: string]: any } = {}
                if (typeValue === 'subfeature') {
                    fields['parent_type'] = Property.StaticDropdown({
                        displayName: 'Parent Type',
                        required: true,
                        options: {
                            options: [
                                { label: 'Feature', value: 'feature' },
                            ]
                        }
                    })
                } else {
                    fields['parent_type'] = Property.StaticDropdown({
                        displayName: 'Parent Type',
                        required: true,
                        options: {
                            options: [
                                { label: 'Product', value: 'product' },
                                { label: 'Component', value: 'component' },
                            ]
                        }
                    })
                }
                return fields
            }
        }),
        parent_id: Property.Dropdown({
            displayName: 'Parent',
            required: true,
            refreshers: ['parent_type'],
            options: async (props) => {
                const auth = props['auth'] as string
                const parent_type = props['parent_type'] as unknown as { parent_type: string }

                if (!auth) return { disabled: true, options: [], placeholder: 'Please authenticate first' };
                if (!parent_type) return { disabled: true, options: [], placeholder: 'Please select a parent type first' };

                const parentTypeValue = parent_type.parent_type
                let resourceUri = ''
                if (parentTypeValue === 'product') resourceUri = '/products'
                else if (parentTypeValue === 'component') resourceUri = '/components'
                else if (parentTypeValue === 'feature') resourceUri = '/features'

                if (!resourceUri) return { disabled: true, options: [], placeholder: 'Invalid parent type' };

                const response = await productboardCommon.apiCall({
                    auth: auth as string,
                    method: HttpMethod.GET,
                    resourceUri: resourceUri
                });
                const items = response.body['data'] || [];

                let filteredItems = items;
                if (parentTypeValue === 'feature') {
                    filteredItems = items.filter((item: { type: string }) => item.type === 'feature');
                }

                return {
                    disabled: false,
                    options: filteredItems.map((item: { id: string; name: string }) => ({
                        label: item.name,
                        value: item.id
                    }))
                };
            }
        }),
        archived: Property.Checkbox({
            displayName: 'Archived',
            description: 'A flag denoting if the feature is archived. If null, it will default to `false`.',
            required: false,
        }),
    },
    async run(context) {
        const { name, description, type, status, parent_type, parent_id, archived } = context.propsValue;

        const feature: Record<string, any> = {
            data: {
                name,
                description: `<p>${description}</p>`,
                type,
                status: {
                    id: status,
                },
                parent: {
                    [(parent_type as { parent_type: string }).parent_type]: {
                        id: parent_id,
                    },
                },
                archived: archived,
            },
        };

        const response = await productboardCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/features',
            body: feature,
        });

        return response.body;
    },
});
