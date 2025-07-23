import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const cloudinaryAuth = PieceAuth.CustomAuth({
    required: true,
    description: 'Enter your Cloudinary account credentials. Find these in your Cloudinary Console settings under the API keys page.',
    props: {
        api_key: Property.ShortText({
            displayName: 'API Key',
            description: 'Your Cloudinary API Key. Found in Console Settings → API Keys page.',
            required: true,
        }),
        api_secret: PieceAuth.SecretText({
            displayName: 'API Secret',
            description: 'Your Cloudinary API Secret. Found in Console Settings → API Keys page. Keep this secure and never share publicly.',
            required: true,
        }),
        cloud_name: Property.ShortText({
            displayName: 'Cloud Name',
            description: 'Your Cloudinary Cloud Name. Found in Console Settings → API Keys page or in your dashboard URL (e.g., "demo" from console.cloudinary.com/console/demo).',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            if (!auth) {
                return {
                    valid: false,
                    error: 'Authentication credentials are required. Please provide your API Key, API Secret, and Cloud Name from your Cloudinary Console.',
                };
            }
            await makeRequest(auth, HttpMethod.GET, '/folders');
            return {
                valid: true,
            };
        } catch (error: any) {
            return {
                valid: false,
                error: 'Invalid credentials. Please check your API Key, API Secret, and Cloud Name in your Cloudinary Console Settings → API Keys page.',
            };
        }
    },
});
