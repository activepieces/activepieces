import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PiecePropValueSchema } from '@activepieces/pieces-framework';

const BASE_URL = 'https://campaigns.zoho.com/api/v1.1';

export const zohoCommon = {
    async makeRequest({
        auth,
        method,
        path,
        body,
        queryParams,
    }: {
        auth: OAuth2PropertyValue;
        method: HttpMethod;
        path: string;
        body?: Record<string, unknown>;
        queryParams?: Record<string, string>;
    }) {
        try {
            const response = await httpClient.sendRequest({
                method,
                url: `${BASE_URL}${path}`,
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`,
                    'Content-Type': 'application/json',
                },
                body,
                queryParams,
                timeout: 10000,
            });

            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            if (response.status >= 400) {
                throw new Error(`Zoho Campaigns API error: ${response.body?.message || response.statusText}`);
            }

            return response.body;
        } catch (error) {
            if (error instanceof HttpError) {
                switch (error.status) {
                    case 401:
                        throw new Error('Authentication failed. Please check your credentials.');
                    case 403:
                        throw new Error('Permission denied. Please check your API access rights.');
                    case 404:
                        throw new Error('Resource not found. Please check your request parameters.');
                    default:
                        throw new Error(`API request failed: ${error.message}`);
                }
            }
            throw error;
        }
    },

    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
};
