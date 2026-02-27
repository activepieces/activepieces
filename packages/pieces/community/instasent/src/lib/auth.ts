import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/constants';

const authDescriptionMarkdown = `
## Obtain your auth data
1. Go to https://dashboard.instasent.com
2. Access to your project
3. Create an Activepieces data source
4. Copy the auth parameters and paste them in the fields below
`;

function getBaseUrl(auth: { projectId: string, datasourceId: string }) {
    return `${BASE_URL}/project/${auth.projectId}/datasource/${auth.datasourceId}`;
}

export const instasentAuth = PieceAuth.CustomAuth({
    description: authDescriptionMarkdown,
    props: {
        projectId: PieceAuth.SecretText({
            displayName: 'Project ID',
            description: 'Your Instasent Project ID',
            required: true,
        }),
        datasourceId: PieceAuth.SecretText({
            displayName: 'Datasource ID',
            description: 'Your Instasent Datasource ID',
            required: true,
        }),
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Your Instasent API Bearer Token',
            required: true,
        })
    },
    validate: async ({ auth }) => {
        const authData = auth;

        try {
            const baseUrl = getBaseUrl(authData);
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${baseUrl}/stream`,
                headers: {
                    'Authorization': `Bearer ${auth.apiKey}`
                }
            });

            const data = response.body;
            if (!data.organization || !data.stream || !data.datasource || !data.project) {
                return {
                    valid: false,
                    error: 'Invalid API response structure'
                };
            }

            return {
                valid: true
            };
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            const response = err['response'] as Record<string, unknown> | undefined;
            const data = response?.['data'] as Record<string, string> | undefined;
            return {
                valid: false,
                error: data?.['message'] || 'Invalid credentials or connection error'
            };
        }
    },
    required: true
});
