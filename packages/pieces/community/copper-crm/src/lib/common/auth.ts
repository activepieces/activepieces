import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const copperAuth = PieceAuth.CustomAuth({
    displayName: 'Copper CRM Authentication',
    description: 'Provide your Copper CRM API Key and the email address associated with it.',
    props: {
        api_key: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Enter your Copper CRM API key. You can generate one in the Copper web app under System settings > API Keys.',
            required: true,
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'Enter the email address of the user who generated this API key.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        if (auth.api_key && auth.user_email) {
            return {
                valid: true,
            };
        }

        return {
            valid: false,
            error: 'API Key and User Email are required for authentication.',
        };
    },
    required: true,
});