import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const ampecoAuth = PieceAuth.CustomAuth({
    description: 'Ampeco Platform',
    required: true,
    props: {
        baseApiUrl: Property.ShortText({
            displayName: 'Base URL',
            required: true,
        }),
        token: PieceAuth.SecretText({
            displayName: 'API Token',
            required: true,
            description:`Navigate to the API Access Tokens menu within your account.Click the Create API Access Token button to initiate the token creation process.`
        }),
    },
});