import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const clockifyAuth = PieceAuth.SecretText({
  displayName:'API Key',
  required:true
})

export const clockify = createPiece({
	displayName: 'Clockify',
	auth: clockifyAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/clockify.png',
	authors: ['rimjhimyadav'],
	actions: [],
	triggers: [],
});
