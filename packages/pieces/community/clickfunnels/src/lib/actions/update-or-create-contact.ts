import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const updateOrCreateContact = createAction({
    name: 'update_or_create_contact',
    displayName: 'Update or Create Contact',
    description: 'Searches for a contact by email and updates it, or creates a new one if not found',
    auth: clickfunnelsAuth,
    props: {
        workspace_id: Property.ShortText({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace',
            required: true,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'Email address of the contact',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Phone number of the contact',
            required: false,
        }),
        time_zone: Property.ShortText({
            displayName: 'Time Zone',
            description: 'Time zone (e.g., America/New_York)',
            required: false,
        }),
        uuid: Property.ShortText({
            displayName: 'UUID',
            description: 'External UUID for the contact',
            required: false,
        }),
        anonymous: Property.ShortText({
            displayName: 'Anonymous',
            description: 'Anonymous identifier for the contact',
            required: false,
        }),
        unsubscribed_at: Property.DateTime({
            displayName: 'Unsubscribed At',
            description: 'Date/time when contact unsubscribed',
            required: false,
        }),
        fb_url: Property.ShortText({
            displayName: 'Facebook URL',
            description: 'Facebook profile URL',
            required: false,
        }),
        twitter_url: Property.ShortText({
            displayName: 'Twitter URL',
            description: 'Twitter profile URL',
            required: false,
        }),
        instagram_url: Property.ShortText({
            displayName: 'Instagram URL',
            description: 'Instagram profile URL',
            required: false,
        }),
        linkedin_url: Property.ShortText({
            displayName: 'LinkedIn URL',
            description: 'LinkedIn profile URL',
            required: false,
        }),
        website_url: Property.ShortText({
            displayName: 'Website URL',
            description: 'Personal or business website URL',
            required: false,
        }),
        custom_attributes: Property.Object({
            displayName: 'Custom Attributes',
            description: 'Dynamic key-value pairs for custom contact attributes',
            required: false,
        }),
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        const workspaceId = context.propsValue.workspace_id;
        
        let existingContact = null;
        try {
            const searchResponse = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/contacts',
                queryParams: {
                    'filter[email_address]': context.propsValue.email_address
                },
                subdomain,
            });

            if (searchResponse.body.length > 0) {
                existingContact = searchResponse.body.find(
                    (contact: any) => contact.email_address === context.propsValue.email_address
                );
            }
        } catch (error) {
            // Continue with creation if search fails
        }

        const contactData: Record<string, any> = {
            email_address: context.propsValue.email_address,
        };

        if (context.propsValue.first_name) {
            contactData['first_name'] = context.propsValue.first_name;
        }

        if (context.propsValue.last_name) {
            contactData['last_name'] = context.propsValue.last_name;
        }

        if (context.propsValue.phone_number) {
            contactData['phone_number'] = context.propsValue.phone_number;
        }

        if (context.propsValue.time_zone) {
            contactData['time_zone'] = context.propsValue.time_zone;
        }

        if (context.propsValue.uuid) {
            contactData['uuid'] = context.propsValue.uuid;
        }

        if (context.propsValue.anonymous) {
            contactData['anonymous'] = context.propsValue.anonymous;
        }

        if (context.propsValue.unsubscribed_at) {
            contactData['unsubscribed_at'] = new Date(context.propsValue.unsubscribed_at).toISOString();
        }

        if (context.propsValue.fb_url) {
            contactData['fb_url'] = context.propsValue.fb_url;
        }

        if (context.propsValue.twitter_url) {
            contactData['twitter_url'] = context.propsValue.twitter_url;
        }

        if (context.propsValue.instagram_url) {
            contactData['instagram_url'] = context.propsValue.instagram_url;
        }

        if (context.propsValue.linkedin_url) {
            contactData['linkedin_url'] = context.propsValue.linkedin_url;
        }

        if (context.propsValue.website_url) {
            contactData['website_url'] = context.propsValue.website_url;
        }

        if (context.propsValue.custom_attributes) {
            contactData['custom_attributes'] = context.propsValue.custom_attributes;
        }

        if (existingContact) {
            const response = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.PUT,
                resourceUri: `/contacts/${existingContact.id}`,
                body: { contact: contactData },
                subdomain,
            });

            return {
                ...response.body,
                operation: 'updated'
            };
        } else {
            const response = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.POST,
                resourceUri: `/workspaces/${workspaceId}/contacts`,
                body: { contact: contactData },
                subdomain,
            });

            return {
                ...response.body,
                operation: 'created'
            };
        }
    },
});
