import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const removeTagFromContact = createAction({
    name: 'remove_tag_from_contact',
    displayName: 'Remove Tag From Contact',
    description: 'Remove a specific tag from a contact',
    auth: clickfunnelsAuth,
    props: {
        workspace_id: Property.ShortText({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to remove the tag from',
            required: true,
        }),
        tag_id: Property.Dropdown({
            displayName: 'Tag',
            description: 'Select the tag to remove from the contact',
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
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        
        try {
            const existingTagsResponse = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/contacts/${context.propsValue.contact_id}/applied_tags`,
                subdomain,
            });

            const appliedTag = existingTagsResponse.body.data?.find(
                (appliedTag: any) => appliedTag.relationships?.tag?.data?.id === context.propsValue.tag_id
            );

            if (!appliedTag) {
                return {
                    success: true,
                    message: 'Tag was not applied to contact',
                    tag_id: context.propsValue.tag_id,
                    contact_id: context.propsValue.contact_id,
                    workspace_id: context.propsValue.workspace_id
                };
            }

            await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.DELETE,
                resourceUri: `/contacts/applied_tags/${appliedTag.id}`,
                subdomain,
            });

            return {
                success: true,
                message: 'Tag successfully removed from contact',
                tag_id: context.propsValue.tag_id,
                contact_id: context.propsValue.contact_id,
                workspace_id: context.propsValue.workspace_id,
                removed_applied_tag_id: appliedTag.id
            };
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return {
                    success: true,
                    message: 'Tag was not applied to contact or already removed',
                    tag_id: context.propsValue.tag_id,
                    contact_id: context.propsValue.contact_id,
                    workspace_id: context.propsValue.workspace_id
                };
            }
            throw error;
        }
    },
});
