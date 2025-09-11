import {
    httpClient,
    HttpMethod,
} from '@activepieces/pieces-common';
import {
    PieceAuth,
    PiecePropValueSchema,
    Property,
} from '@activepieces/pieces-framework';

const markdownDescription = `
**To get your API Key:**
1. Login to your Foreplay account.
2. Navigate to your **Account Dashboard**.
3. Find the **Data API** section and generate an API Key.
4. Copy the key and paste it below.
`;

export const foreplayAuth = PieceAuth.CustomAuth({
    required: true,
    description: markdownDescription,
    props: {
        apiKey: Property.ShortText({
            displayName: 'API Key',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        try {
            const { apiKey } = auth as { apiKey: string };
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://public.api.foreplay.co/api/usage',
                headers: {
                    'Authorization': apiKey,
                },
            });

            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    },
});