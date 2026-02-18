import { PieceAuth } from '@activepieces/pieces-framework';

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
            const response = await fetch('https://api.pdfcrowd.com/api/info/', {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Invalid credentials' })) as { message?: string };
                return { valid: false, error: errorData.message || 'Invalid username or API key' };
            }
            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Connection failed: ' + (e as Error).message };
        }
    },
});
