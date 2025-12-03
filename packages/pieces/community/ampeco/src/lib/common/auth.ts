import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const ampecoAuth = PieceAuth.CustomAuth({
    description: 'Ampeco Platform',
    required: true,
    props: {
        baseApiUrl: Property.ShortText({
            displayName: 'Base URL',
            required: true,
            defaultValue: 'https://{tenant_url}',
        }),
        token: PieceAuth.SecretText({
            displayName: 'API Token',
            required: true,
        }),
    },
});