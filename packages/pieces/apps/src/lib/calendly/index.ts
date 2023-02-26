import { createPiece } from '@activepieces/framework';
import { calendlyInviteeCanceled } from './trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './trigger/invitee-created.trigger';

export const calendly = createPiece({
	name: 'calendly',
	displayName: 'Calendly',
	logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
  version: '0.0.0',
	authors: ['AbdulTheActivePiecer'],
	actions: [],
	triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
