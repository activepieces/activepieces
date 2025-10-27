import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uscreenAuth } from '../common/auth';
import { uscreenCommon } from '../common/client';

export const createUser = createAction({
    name: 'create_user',
    displayName: 'Create User',
    description: 'Creates a new user and optionally sends them a welcome email to your storefront',
    auth: uscreenAuth,
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address of the user',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the user',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the user',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Password for the user account',
            required: false,
        }),
        send_welcome_email: Property.Checkbox({
            displayName: 'Send Welcome Email',
            description: 'Whether to send a welcome email to the user',
            required: false,
        }),
        auto_login: Property.Checkbox({
            displayName: 'Auto Login',
            description: 'Whether to automatically log in the user after creation',
            required: false,
        }),
    },
    async run(context) {
        const { email, first_name, last_name, password, send_welcome_email, auto_login } = context.propsValue;

        const body: any = {
            email,
            send_welcome_email: send_welcome_email || false,
            auto_login: auto_login || false
        };

        if (first_name) body.first_name = first_name;
        if (last_name) body.last_name = last_name;
        if (password) body.password = password;

        const response = await uscreenCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/users',
            body,
        });

        return response.body;
    },
});

