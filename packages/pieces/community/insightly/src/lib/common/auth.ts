import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const getBasicAuth = (apiKey: string) => {
    return `Basic ${Buffer.from(apiKey).toString('base64')}`;
};

export const insightlyAuth = PieceAuth.CustomAuth({
    description: `
    To get your API Key and Pod:
    1. Log in to your Insightly account.
    2. Go to 'User Settings'.
    3. Under the 'API' section, you will find your API Key.
    4. Your API URL will also be listed there. The 'pod' is the part of the URL before '.insightly.com' (e.g., if your URL is https://api.na1.insightly.com, your pod is 'na1').
    `,
    required: true,
    props: {
        apiKey: Property.ShortText({
            displayName: 'API Key',
            description: 'Your Insightly API Key.',
            required: true,
        }),
        pod: Property.ShortText({
            displayName: 'Pod/Region',
            description: "The pod from your API URL (e.g., 'na1', 'eu1').",
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        const { apiKey, pod } = auth as { apiKey: string; pod: string };
        try {
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `https://api.${pod}.insightly.com/v3.1/Contacts?top=1`,
                headers: {
                    Authorization: getBasicAuth(apiKey),
                },
            };
            await httpClient.sendRequest(request);
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key or Pod/Region.',
            };
        }
    },
});