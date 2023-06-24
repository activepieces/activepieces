import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';

export const calendlyAuth = PieceAuth.SecretText({
    displayName: "Personal Token",
    required: true,
    description: "Get it from https://calendly.com/integrations/api_webhooks"
})

export const calendly = createPiece({
	displayName: 'Calendly',
	logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
	authors: ['AbdulTheActivePiecer'],
    auth: calendlyAuth,
	actions: [],
	triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
