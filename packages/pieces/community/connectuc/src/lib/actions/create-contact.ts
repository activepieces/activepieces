import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { domainProp, subscriberUuidProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContactAction = createAction({
    auth: connectucAuth,
    name: 'create-contact',
    classification: 'WRITE',
    displayName: 'Create Contact',
    description: 'Create a new contact in ConnectUC',
    audience: 'both',
    aiMetadata: { description: 'Creates a new contact in a ConnectUC user\'s address book under the given domain and subscriber. Use when an agent needs to add a person (name, phone numbers, optional email, company, and tags) to a user\'s contacts. Not idempotent: each call adds another contact record, so calling it repeatedly with the same input creates duplicates.', idempotent: false },
    propertyGroups: [
        { key: 'owner', display: 'section', label: 'Owner', icon: 'user', props: ['domain', 'user'] },
        { key: 'contact', display: 'section', label: 'Contact', icon: 'users', props: ['first_name', 'last_name', 'email', 'company'] },
        { key: 'phones', display: 'section', label: 'Phones & Tags', icon: 'tag', props: ['phones_info', 'phones', 'tags'] },
    ],
    props: {
        domain: domainProp(),
        user: subscriberUuidProp({ description: 'The user whose address book gets the contact.' }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            placeholder: 'Jane',
            width: 'half',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            placeholder: 'Doe',
            width: 'half',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            placeholder: 'jane@example.com',
            width: 'half',
            required: false,
        }),
        phones: Property.Array({
            displayName: 'Phone Numbers',
            description: 'Add one number per entry.',
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            placeholder: 'Acme Inc',
            width: 'half',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Add one tag per entry.',
            required: false,
        }),
        phones_info: Property.MarkDown({
            value: 'Each number is saved as a work phone.',
            variant: MarkdownVariant.INFO,
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
