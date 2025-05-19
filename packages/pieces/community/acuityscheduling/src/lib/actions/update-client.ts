import { createAction, Property } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { createClient } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';

export const updateClientAction = createAction({
    auth: acuityschedulingAuth,
    name: 'update_client',
    displayName: 'Update Client',
    description: 'Update existing client information',
    props: {
        client_id: Property.ShortText({
            displayName: 'Client ID',
            description: 'The ID of the client to update',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'Client\'s first name',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Client\'s last name',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Client\'s email address',
            required: true,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Client\'s phone number',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const {
            client_id,
            first_name,
            last_name,
            email,
            phone,
        } = propsValue;


        const updateData: Record<string, any> = {};
        if (first_name) updateData['first_name'] = first_name;
        if (last_name) updateData['last_name'] = first_name;
        if (email) updateData['email'] = email;
        if (phone) updateData['phone'] = phone;


        try {
            const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
                method: HttpMethod.PATCH,
                url: `${BASE_URL}/Client/createCleint`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth.apiKey && auth.userId,
                },
                body: {
                    client_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                },
            });

            return {
                success: true,
                client: {
                    first_name: response.body.data['first_name'],
                    last_name: response.body.data['last_name'],
                    email: response.body.data['email'],
                    phone: response.body.data['phone'],
                }
            };
        } catch (error: any) {
            console.error('Error updating client:', error);
            throw new Error(`Failed to update client: ${error.message}`);
        }
    },
});
