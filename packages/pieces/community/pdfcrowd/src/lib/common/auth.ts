import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const pdfcrowdAuth = PieceAuth.BasicAuth({
    displayName: 'Pdfcrowd Credentials',
    description: 'Your Pdfcrowd API credentials. Get them at https://pdfcrowd.com/user/account/',
    required: true,
    username: {
        displayName: 'Username',
        description: 'Your Pdfcrowd username',
    },
    password: {
        displayName: 'API Key',
        description: 'Your Pdfcrowd API key',
    },
    validate: async ({ auth }) => {
        try {
            await makeRequest({
                type: AppConnectionType.BASIC_AUTH,
                username: auth.username,
                password: auth.password,
            }, HttpMethod.GET, '/info/');
            return {
                valid: true,
            };
        } catch {
            return {
                valid: false,
                error: 'Invalid username or API key.',
            };
        }
    },
});
