import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { opnformApi } from './common/api';

export const opnformAuth = PieceAuth.CustomAuth({
    description:
        'Please use your Opnform API Key. [Click here for create API Key](https://opnform.com/home?user-settings=access-tokens)\n\nGrant the abilities the steps you use need: workspaces-read/write, workspace-users-read/write, forms-read/write and manage-integrations.',
    required: true,
    props: {
        baseApiUrl: Property.ShortText({
            displayName: `Base URL`,
            description: `Default value is 'https://api.opnform.com'.`,
            required: false,
        }),
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        const { error } = await tryCatch(() =>
            opnformApi.listWorkspaces({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
        );
        return error ? { valid: false, error: 'Invalid API Key' } : { valid: true };
    },
});
