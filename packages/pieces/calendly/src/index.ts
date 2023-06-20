import { AuthProp, Piece } from '@activepieces/pieces-framework';

export const calendly = Piece.create({
    displayName: 'Calendly',
    logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
    authors: ['AbdulTheActivePiecer'],
    auth: AuthProp.SecretText({
        displayName: "Personal Token",
        required: true,
        description: "Get it from https://calendly.com/integrations/api_webhooks"
    }),
});
