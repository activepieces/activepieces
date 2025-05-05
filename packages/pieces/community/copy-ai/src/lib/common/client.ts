import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const copyAiClient = {
    async makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
        const baseUrl = 'https://api.copy.ai/api';
        const response = await httpClient.sendRequest({
            method,
            url: `${baseUrl}${path}`,
            headers: {
                'x-copy-ai-api-key': `${auth}`,
                'Content-Type': 'application/json'
            },
            body
        });
        return response.body;
    }
};
