import { createPiece } from '../../framework/piece';
import { calendlyInviteeCanceled } from './trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './trigger/invitee-created.trigger';


export const calendly = createPiece({
	name: 'calendly',
	displayName: 'Calendly',
	logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
	actions: [],
	triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
