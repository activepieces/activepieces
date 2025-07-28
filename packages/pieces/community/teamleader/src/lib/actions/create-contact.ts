import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createContact = createAction({
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new contact record in Teamleader',
    auth: teamleaderAuth,
    props: {
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address of the contact',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Phone number of the contact',
            required: false,
        }),
        mobile: Property.ShortText({
            displayName: 'Mobile',
            description: 'Mobile number of the contact',
            required: false,
        }),
        website: Property.ShortText({
            displayName: 'Website',
            description: 'Website URL of the contact',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Additional details about the contact',
            required: false,
        }),
    },
    async run(context) {
        const contact: Record<string, any> = {
            first_name: context.propsValue.first_name,
        };

        // Add optional fields if they are provided
        if (context.propsValue.last_name) contact['last_name'] = context.propsValue.last_name;
        if (context.propsValue.email) {
            contact['emails'] = [{
                type: 'primary',
                email: context.propsValue.email
            }];
        }
        if (context.propsValue.phone) {
            contact['telephones'] = [{
                type: 'phone',
                number: context.propsValue.phone
            }];
        }
        if (context.propsValue.mobile) {
            if (!contact['telephones']) contact['telephones'] = [];
            contact['telephones'].push({
                type: 'mobile',
                number: context.propsValue.mobile
            });
        }
        if (context.propsValue.website) {
            contact['website'] = context.propsValue.website;
        }
        if (context.propsValue.description) {
            contact['description'] = context.propsValue.description;
        }

        // Create contact using Teamleader API
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.add',
            body: contact
        });

        return response.body;
    },
});
