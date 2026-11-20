import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { opnformApi } from './common/api';

export const opnformAuth = PieceAuth.CustomAuth({
    description:
        'Connect with an Opnform access token (your API key).\n\n1. In Opnform, open [Settings → Access Tokens](https://opnform.com/home?user-settings=access-tokens).\n2. Create a token with the abilities your steps need: workspaces-read/write, workspace-users-read/write, forms-read/write and manage-integrations.\n3. Paste the token below.',
    required: true,
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'The access token you created in Opnform.',
            required: true,
        }),
        baseApiUrl: Property.ShortText({
            displayName: `Base URL`,
            description: 'Only for self-hosted Opnform. Leave empty for opnform.com.',
            placeholder: 'https://forms.example.com/api',
            required: false,
        }),
    },
    validate: async ({ auth }) => {
        const { error } = await tryCatch(() =>
            opnformApi.listWorkspaces({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
        );
        return error ? { valid: false, error: 'Invalid API Key' } : { valid: true };
    },
});
