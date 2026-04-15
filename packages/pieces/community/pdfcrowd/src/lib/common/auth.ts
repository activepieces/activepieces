import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

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
            const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.pdfcrowd.com/api/info/',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });
            if (response.status >= 400) {
                return { valid: false, error: 'Invalid username or API key' };
            }
            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Connection failed: ' + (e as Error).message };
        }
    },
});
