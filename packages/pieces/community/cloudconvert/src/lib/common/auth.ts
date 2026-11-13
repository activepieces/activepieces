import { OAuth2GrantType } from '@activepieces/pieces-framework';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const cloudconvertAuth = PieceAuth.OAuth2({
    description: 'Connect your CloudConvert account using OAuth2',
    authUrl: 'https://cloudconvert.com/oauth/authorize',
    tokenUrl: 'https://cloudconvert.com/oauth/token',
    required: true,
    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
    scope: ['task.read', 'task.write', 'user.read'],
    props: {
        region: Property.StaticDropdown({
            displayName: 'Region',
            description: 'CloudConvert processing region',
            required: true,
            options: {
                options: [
                    { label: 'Auto (Nearest)', value: 'auto' },
                    { label: 'EU Central (Germany)', value: 'eu-central' },
                    { label: 'US East (Virginia)', value: 'us-east' },
                ]
            },
            defaultValue: 'auto'
        })
    },
    getConnectionIdentifier: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest<CloudConvertUser>({
                method: HttpMethod.GET,
                url: 'https://api.cloudconvert.com/v2/users/me',
                headers: { Authorization: `Bearer ${auth.access_token}` },
                timeout: 5000,
            });
            return response.body?.data?.email || response.body?.data?.username || undefined;
        } catch {
            return undefined;
        }
    },
});

type CloudConvertUser = { data?: { email?: string; username?: string } };
