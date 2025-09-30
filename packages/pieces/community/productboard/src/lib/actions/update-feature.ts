import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const updateFeature = createAction({
    name: 'update_feature',
    displayName: 'Update Feature',
    description: 'Updates an existing feature in Productboard (only specified fields will be changed)',
    auth: productboardAuth,
    props: {
        feature_id: Property.Dropdown({
            displayName: 'Feature',
            description: 'Feature to update',
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
                        resourceUri: '/features'
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
        name: Property.ShortText({
            displayName: 'Feature Name',
            description: 'New name of the feature',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'New description of the feature',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'New status of the feature',
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
            description: 'New type of the feature',
            required: false,
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
            description: 'New priority level of the feature',
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
            description: 'New parent feature for hierarchical features',
            required: false,
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
                        resourceUri: '/features'
                    });

                    const features = response.body.data || [];
                    const options = features.map((feature: any) => ({
                        label: feature.name || `Feature ${feature.id}`,
                        value: feature.id
                    }));

                    // Add option to clear parent (empty selection)
                    options.unshift({
                        label: 'No parent (remove hierarchy)',
                        value: ''
                    });

                    return {
                        disabled: false,
                        options: options
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
            description: 'Tags to assign to the feature (replaces existing tags)',
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
                data: {}
            };

            if (context.propsValue.name) {
                feature['data'].name = context.propsValue.name;
            }

            if (context.propsValue.description !== undefined) {
                feature['data'].description = context.propsValue.description;
            }

            if (context.propsValue.status) {
                feature['data'].status = context.propsValue.status;
            }

            if (context.propsValue.type) {
                feature['data'].type = context.propsValue.type;
            }

            if (context.propsValue.priority) {
                feature['data'].priority = context.propsValue.priority;
            }

            if (context.propsValue.parent_id) {
                feature['data'].parent = { id: context.propsValue.parent_id };
            } else if (context.propsValue.parent_id === '') {
                feature['data'].parent = null;
            }

            if (context.propsValue.tag_names && context.propsValue.tag_names.length > 0) {
                feature['data'].tags = context.propsValue.tag_names.map((tagObj: any) => ({
                    name: tagObj.tag
                }));
            }

            const response = await productboardCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.PATCH,
                resourceUri: `/features/${context.propsValue.feature_id}`,
                body: feature
            });

            return response.body;
        } catch (error) {
            throw new Error(`Failed to update feature: ${error}`);
        }
    },
});
