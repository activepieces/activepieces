import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';


export type ServiceNowAuth = {
    instance_url: string;
    api_key: string;
};

export const serviceNowAuth = PieceAuth.CustomAuth({
    description: `
    To get your API key:
    1. Ensure the 'API Key and HMAC Authentication' plugin is active in your ServiceNow instance.
    2. Navigate to **System Web Services > API Access Policies > Inbound Authentication Profiles** and create a new API Key profile.
    3. Navigate to **System Web Services > API Access Policies > REST API Key** to generate a new key and associate it with a user who has the required permissions.
    4. Create a **REST API Access Policy** to grant access to the necessary APIs (e.g., Table API).
    `,
    required: true,
    props: {
        instance_url: Property.ShortText({
            displayName: 'Instance URL',
            description: 'Your ServiceNow instance URL (e.g., https://your-instance.service-now.com)',
            required: true,
        }),
        api_key: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'The generated REST API key.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            const { instance_url, api_key } = auth as ServiceNowAuth;
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${instance_url.trim()}/api/now/table/incident?sysparm_limit=1`,
                headers: {
                    'Accept': 'application/json',
                    'x-sn-apikey': api_key,
                },
            };
            await httpClient.sendRequest(request);
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Connection failed. Please check your Instance URL and API Key.',
            };
        }
    },
});