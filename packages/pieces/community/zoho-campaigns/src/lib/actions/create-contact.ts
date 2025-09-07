import { createAction, Property } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
    name: 'create_contact',
    displayName: 'Add/Update Contact',
    description: 'Add a new contact or update an existing one without sending confirmation',
    props: {
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: true,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address of the contact',
            required: true,
            validation: {
                custom: (value) => {
                    if (!zohoCommon.validateEmail(value)) {
                        return 'Please enter a valid email address';
                    }
                    return undefined;
                }
            }
        }),
        listKey: Property.ShortText({
            displayName: 'Mailing List Key',
            description: 'The key of the mailing list to add the contact to',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to apply to the contact',
            required: false,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'Source of the contact (e.g., Website, Social Media)',
            required: false,
        }),
    },
    async run(context) {
        // Input validation
        if (!context.propsValue.email || !zohoCommon.validateEmail(context.propsValue.email)) {
            throw new Error('Invalid email address provided');
        }

        const body: Record<string, unknown> = {
            firstName: context.propsValue.firstName?.trim(),
            lastName: context.propsValue.lastName?.trim(),
            email: context.propsValue.email.trim().toLowerCase(),
            listKey: context.propsValue.listKey,
        };

        if (context.propsValue.tags) {
            body.tags = context.propsValue.tags;
        }

        if (context.propsValue.source) {
            body.source = context.propsValue.source;
        }

        try {
            const response = await zohoCommon.makeRequest({
                auth: context.auth,
                method: HttpMethod.POST,
                path: '/addcontact',
                body,
            });

            return {
                success: true,
                contactId: response.contact_id,
                ...response
            };
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    // Update existing contact
                    return await zohoCommon.makeRequest({
                        auth: context.auth,
                        method: HttpMethod.PUT,
                        path: '/updatecontact',
                        body,
                    });
                }
                throw error;
            }
            throw new Error('Failed to create/update contact');
        }
    },
});
