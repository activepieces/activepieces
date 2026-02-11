import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const klaviyoCommon = {
    baseUrl: 'https://a.klaviyo.com/api',
    apiVersion: '2024-10-15',
    list_id: Property.Dropdown({
        displayName: 'List',
        description: 'Select the Klaviyo list',
        required: true,
        refreshers: ['auth'],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account', options: [] };
            }
            try {
                const response = await httpClient.sendRequest<{ data: { id: string, attributes: { name: string } }[] }>({
                    method: HttpMethod.GET,
                    url: 'https://a.klaviyo.com/api/lists',
                    headers: {
                        'revision': '2024-10-15',
                        'accept': 'application/vnd.api+json'
                    },
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: auth as string,
                    },
                });
                return {
                    disabled: false,
                    options: response.body.data.map(list => ({
                        label: list.attributes.name,
                        value: list.id,
                    })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching lists', options: [] };
            }
        },
    }),
};
