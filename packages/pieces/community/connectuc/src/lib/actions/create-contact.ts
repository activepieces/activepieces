import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { domainProp, subscriberUuidProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContactAction = createAction({
    auth: connectucAuth,
    name: 'create-contact',
    displayName: 'Create Contact',
    description: 'Create a new contact in ConnectUC',
    props: {
        domain: domainProp(),
        user: subscriberUuidProp(),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'The first name of the contact',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'The last name of the contact',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the contact',
            required: false,
        }),
        phones: Property.Array({
            displayName: 'Phones',
            description: 'The phone numbers of the contact',
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company of the contact',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags of the contact',
            required: false,
        }),
    },
    async run(context) {
        const { user, first_name, last_name, email, phones, company, tags } = context.propsValue;

        const tels = phones.map((phone) => ({ number: String(phone), type: 'work' }));
        const formattedTags = tags ? tags.map((tag) => ({ name: String(tag) })) : [];

        const body: Record<string, unknown> = {
            first_name: first_name,
            last_name: last_name,
            emails: email ? [{ value: email, type: 'work' }] : [],
            tels: tels,
            company: company || '',
            tags: formattedTags,
        };

        try {
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${user}/contacts`,
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to create contact: ${message}`);
        }
    },
});
