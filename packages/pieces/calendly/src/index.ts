import { createPiece } from '@activepieces/pieces-framework';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';

export const calendly = createPiece({
	displayName: 'Calendly',
	logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
	authors: ['AbdulTheActivePiecer'],
	actions: [],
	triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
