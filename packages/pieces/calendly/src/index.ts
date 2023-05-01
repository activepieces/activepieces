import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';

export const calendly = createPiece({
	name: 'calendly',
	displayName: 'Calendly',
	logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
  version: packageJson.version,
	type: PieceType.PUBLIC,
	authors: ['AbdulTheActivePiecer'],
	actions: [],
	triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
