import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const createFeature = createAction({
    name: 'create_feature',
    displayName: 'Create Feature',
    description: 'Create a new feature under a specific product in Productboard',
    auth: productboardAuth,
    props: {
        product_id: Property.Dropdown({
            displayName: 'Product',
            description: 'Product where the feature will be created',
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

                try {
                    const response = await productboardCommon.apiCall({
                        auth: auth as string,
                        method: HttpMethod.GET,
                        resourceUri: '/products'
                    });

                    const products = response.body.data || [];
                    return {
                        disabled: false,
                        options: products.map((product: any) => ({
                            label: product.name || `Product ${product.id}`,
                            value: product.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading products'
                    };
                }
            }
        }),
        name: Property.ShortText({
            displayName: 'Feature Name',
            description: 'Name of the feature',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the feature',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Current status of the feature',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'open' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Done', value: 'done' },
                    { label: 'Closed', value: 'closed' }
                ]
            }
        }),
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: 'Type of the feature',
            required: true,
            options: {
                options: [
                    { label: 'Feature', value: 'feature' },
                    { label: 'Bug', value: 'bug' },
                    { label: 'Improvement', value: 'improvement' },
                    { label: 'Epic', value: 'epic' }
                ]
            }
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'Priority level of the feature',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'High', value: 'high' },
                    { label: 'Critical', value: 'critical' }
                ]
            }
        }),
        parent_id: Property.Dropdown({
            displayName: 'Parent Feature',
            description: 'Parent feature for hierarchical features',
            required: false,
            refreshers: ['product_id'],
            options: async ({ auth, product_id }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first'
                    };
                }

                if (!product_id) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a product first'
                    };
                }

                try {
                    const response = await productboardCommon.apiCall({
                        auth: auth as string,
                        method: HttpMethod.GET,
                        resourceUri: '/features',
                        queryParams: {
                            product_id: product_id as string
                        }
                    });

                    const features = response.body.data || [];
                    return {
                        disabled: false,
                        options: features.map((feature: any) => ({
                            label: feature.name || `Feature ${feature.id}`,
                            value: feature.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading features'
                    };
                }
            }
        }),
        tag_names: Property.Array({
            displayName: 'Tags',
            description: 'Tags to assign to the feature',
            required: false,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag Name',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        try {
            const feature: Record<string, any> = {
                data: {
                    name: context.propsValue.name,
                    type: context.propsValue.type,
                }
            };

            if (context.propsValue.description) {
                feature['data'].description = context.propsValue.description;
            }

            if (context.propsValue.status) {
                feature['data'].status = context.propsValue.status;
            }

            if (context.propsValue.priority) {
                feature['data'].priority = context.propsValue.priority;
            }

            if (context.propsValue.parent_id) {
                feature['data'].parent = { id: context.propsValue.parent_id };
            }

            if (context.propsValue.tag_names && context.propsValue.tag_names.length > 0) {
                feature['data'].tags = context.propsValue.tag_names.map((tagObj: any) => ({
                    name: tagObj.tag
                }));
            }

            const response = await productboardCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.POST,
                resourceUri: '/features',
                body: feature,
                queryParams: {
                    product_id: context.propsValue.product_id
                }
            });

            return response.body;
        } catch (error) {
            throw new Error(`Failed to create feature: ${error}`);
        }
    },
});
