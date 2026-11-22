import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/constants';

const authDescriptionMarkdown = `Connect Instasent with the credentials of an Activepieces data source.

1. Sign in to the [Instasent dashboard](https://dashboard.instasent.com).
2. Open your project.
3. Create an **Activepieces** data source.
4. Copy its Project ID, Datasource ID and API Key into the fields below.`;

function getBaseUrl(auth: { projectId: string, datasourceId: string }) {
    return `${BASE_URL}/project/${auth.projectId}/datasource/${auth.datasourceId}`;
}

export const instasentAuth = PieceAuth.CustomAuth({
    description: authDescriptionMarkdown,
    props: {
        projectId: PieceAuth.SecretText({
            displayName: 'Project ID',
            description: 'Shown in your Activepieces data source settings.',
            required: true,
        }),
        datasourceId: PieceAuth.SecretText({
            displayName: 'Datasource ID',
            description: 'Shown in your Activepieces data source settings.',
            required: true,
        }),
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'The API token shown when you created the data source.',
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
