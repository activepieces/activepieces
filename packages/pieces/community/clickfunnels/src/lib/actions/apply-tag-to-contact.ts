import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const applyTagToContact = createAction({
    name: 'apply_tag_to_contact',
    displayName: 'Apply Tag to Contact',
    description: 'Apply a tag to a contact if it doesn\'t already exist',
    auth: clickfunnelsAuth,
    props: {
        workspace_id: Property.ShortText({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to tag',
            required: true,
        }),
        tag_id: Property.Dropdown({
            displayName: 'Tag',
            description: 'Select the tag to apply',
            required: true,
            refreshers: ['workspace_id'],
            options: async ({ auth, workspace_id }) => {
                if (!auth || !workspace_id) return {
                    disabled: true,
                    options: [],
                    placeholder: workspace_id ? 'Please authenticate first' : 'Please enter workspace ID first'
                };

                try {
                    const subdomain = clickfunnelsCommon.extractSubdomain(auth as any);
                    const response = await clickfunnelsCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: `/workspaces/${workspace_id}/contacts/tags`,
                        subdomain,
                    });

                    return {
                        disabled: false,
                        options: response.body.map((tag: any) => ({
                            label: tag.name,
                            value: tag.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading tags'
                    };
                }
            }
        }),
        create_tag_if_missing: Property.Checkbox({
            displayName: 'Create Tag If Missing',
            description: 'Create the tag if it doesn\'t exist',
            required: false,
            defaultValue: false,
        }),
        tag_name: Property.ShortText({
            displayName: 'Tag Name',
            description: 'Name of the tag to create (only used if Create Tag If Missing is enabled)',
            required: false,
        }),
        tag_color: Property.ShortText({
            displayName: 'Tag Color',
            description: 'Hex color code for the new tag (e.g., #4485fe)',
            required: false,
            defaultValue: '#4485fe',
        }),
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        const workspaceId = context.propsValue.workspace_id;
        
        let tagId = context.propsValue.tag_id;

        if (context.propsValue.create_tag_if_missing && context.propsValue.tag_name && !tagId) {
            try {
                const createTagResponse = await clickfunnelsCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.POST,
                    resourceUri: `/workspaces/${workspaceId}/contacts/tags`,
                    body: {
                        contacts_tag: {
                            name: context.propsValue.tag_name,
                            color: context.propsValue.tag_color || '#4485fe'
                        }
                    },
                    subdomain,
                });
                tagId = createTagResponse.body.id;
            } catch (error) {
                const existingTagsResponse = await clickfunnelsCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.GET,
                    resourceUri: `/workspaces/${workspaceId}/contacts/tags`,
                    subdomain,
                });
                
                const existingTag = existingTagsResponse.body.find(
                    (tag: any) => tag.name === context.propsValue.tag_name
                );
                
                if (existingTag) {
                    tagId = existingTag.id;
                } else {
                    throw error;
                }
            }
        }

        const existingTagsResponse = await clickfunnelsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: `/contacts/${context.propsValue.contact_id}/applied_tags`,
            subdomain,
        });

        const isTagAlreadyApplied = existingTagsResponse.body.data?.some(
            (appliedTag: any) => appliedTag.relationships?.tag?.data?.id === tagId
        );

        if (isTagAlreadyApplied) {
            return {
                success: true,
                message: 'Tag already applied to contact',
                tag_id: tagId,
                contact_id: context.propsValue.contact_id,
                workspace_id: workspaceId
            };
        }

        const response = await clickfunnelsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts/applied_tags',
            body: {
                applied_tag: {
                    contact_id: context.propsValue.contact_id,
                    tag_id: tagId
                }
            },
            subdomain,
        });

        return response.body;
    },
});
