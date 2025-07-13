import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';


export const cloudinaryAuth = PieceAuth.CustomAuth({
    required: true,
    description: 'Enter custom authentication details',
    props: {
        api_key: Property.ShortText({
            displayName: 'Api Key',
            description: 'Enter the Api Key',
            required: true,
        }),
        api_secret: PieceAuth.SecretText({
            displayName: 'Api Secret',
            description: 'Enter the Api Secret',
            required: true,
        }),
        cloud_name: Property.ShortText({
            displayName: 'Cloud Name',
            description: 'Enter the cloud name',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            if (!auth) {
                return {
                    valid: false,
                    error: 'Authentication credentials are required',
                };
            }
            await makeRequest(auth, HttpMethod.GET, '/folders');
            return {
                valid: true,
            };
        } catch {
            return {
                valid: false,
                error: 'Invalid Api Key',
            };
        }
    },
});
