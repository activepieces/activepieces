import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const fellowAuth = PieceAuth.CustomAuth({
    required: true,
    props: {
        apiKey: Property.ShortText({
            displayName: 'API Key',
            description: `You can obtain API key by navigating to **User Settings -> Developer Tools**.`,
            required: true,
        }),
        subdomain: Property.ShortText({
            displayName: 'Subdomain',
            description: `You can obtain your workspace domain from URL.For example,subdomain for 'https://**test**.fellow.app/' is **test**.`,
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: getBaseUrl(auth.subdomain) + '/me',
                headers: {
                    'X-API-KEY': auth.apiKey
                }
            })

            return {
                valid: true
            }
        }
        catch {
            return {
                valid: false,
                error: 'Invalid Credentials.'
            }
        }
    }
});

export const getBaseUrl = (subdomain: string) => {
    return `https://${subdomain}.fellow.app/api/v1`;
};
