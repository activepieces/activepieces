import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { hkVoiceApi } from './common/client';

export const hkVoiceAuth = PieceAuth.CustomAuth({
    displayName: 'HK Voice Account',
    description:
        'Connect the Heykoala Voice organization you already use for agents, call flows, and campaigns. Create an API key in Voice (Account → API keys) with the scopes your flows need.',
    required: true,
    props: {
        base_url: Property.ShortText({
            displayName: 'Voice API URL',
            description:
                'Production: https://voice.heykoala.ai — Development: https://dvoice.heykoala.ai. You can paste the host only; the piece appends /api/v1/ext.',
            required: true,
            defaultValue: 'https://voice.heykoala.ai',
        }),
        api_key: PieceAuth.SecretText({
            displayName: 'API Key',
            description:
                'Org-bound partner key starting with hk_api_. Voice Settings → API keys. The organization is bound to the key — do not send a separate account header.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${hkVoiceApi.normalizeBaseUrl({ baseUrl: auth.base_url })}${hkVoiceApi.paths.discovery}`,
                headers: hkVoiceApi.authHeaders({
                    apiKey: auth.api_key,
                }),
            });
            const body = response.body;
            if (
                typeof body === 'object' &&
                body !== null &&
                'status' in body &&
                body.status !== true
            ) {
                return {
                    valid: false,
                    error: 'Voice discovery did not return status=true. Check the API key and that the organization has api_enabled.',
                };
            }
            return { valid: true };
        } catch {
            return {
                valid: false,
                error:
                    'Could not reach GET /api/v1/ext/ on that Voice host. Check the URL and API key. The organization must have API access enabled.',
            };
        }
    },
    getConnectionIdentifier: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${hkVoiceApi.normalizeBaseUrl({ baseUrl: auth.base_url })}${hkVoiceApi.paths.discovery}`,
                headers: hkVoiceApi.authHeaders({
                    apiKey: auth.api_key,
                }),
            });
            const data = hkVoiceApi.unwrapData(response.body);
            if (
                typeof data === 'object' &&
                data !== null &&
                'organization' in data &&
                typeof data.organization === 'string'
            ) {
                return data.organization;
            }
        } catch {
            return undefined;
        }
        return undefined;
    },
});
