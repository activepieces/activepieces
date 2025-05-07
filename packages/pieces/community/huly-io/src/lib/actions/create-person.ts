import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

export const createPerson = createAction({
    auth: hulyIoAuth,
    name: 'create_person',
    displayName: 'Create Person',
    description: 'Create a new person record and attach an email as a communication channel',
    props: {
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'The person\'s first name',
            required: true,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'The person\'s last name',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The person\'s email address',
            required: true,
        }),
        role: Property.ShortText({
            displayName: 'Role',
            description: 'The person\'s role in the organization',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'POST',
            '/people/create',
            {
                firstName: propsValue.firstName,
                lastName: propsValue.lastName,
                channels: [
                    {
                        type: 'email',
                        value: propsValue.email
                    }
                ],
                role: propsValue.role || undefined
            }
        );

        return response.data || {};
    },
});
