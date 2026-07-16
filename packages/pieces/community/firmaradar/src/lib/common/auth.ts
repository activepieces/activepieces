import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { DEFAULT_BASE_URL, buildRequest } from './client';

/**
 * Firmaradar connection: API key (`X-API-Key`) + base URL.
 *
 * The key is created on https://firmaradar.no/min-side/api-keys. The base
 * URL is configurable for self-hosted/staging instances and defaults to
 * the hosted platform.
 */
export const firmaradarAuth = PieceAuth.CustomAuth({
    description:
        'Connect your Firmaradar account. Create an API key at ' +
        'https://firmaradar.no/min-side/api-keys. Leave the base URL ' +
        'unchanged unless you run a dedicated Firmaradar instance.',
    required: true,
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'API key from firmaradar.no › My page › API keys.',
            required: true,
        }),
        baseUrl: Property.ShortText({
            displayName: 'Base URL',
            description: 'Firmaradar instance URL. Default: ' + DEFAULT_BASE_URL,
            required: false,
            defaultValue: DEFAULT_BASE_URL,
        }),
    },
    validate: async ({ auth }) => {
        try {
            // Cheap authenticated read — proves both base URL and key.
            await httpClient.sendRequest(
                buildRequest(auth, {
                    method: HttpMethod.GET,
                    path: '/api/v1/companies/search',
                    query: { q: 'firmaradar', limit: 1 },
                }),
            );
            return { valid: true };
        } catch (error) {
            const status = (error as { response?: { status?: number } } | null)?.response?.status;
            return {
                valid: false,
                error:
                    status === 401 || status === 403
                        ? 'Firmaradar rejected the API key. Check the key on firmaradar.no › My page › API keys.'
                        : 'Could not reach the Firmaradar API. Check the base URL and try again.',
            };
        }
    },
});
