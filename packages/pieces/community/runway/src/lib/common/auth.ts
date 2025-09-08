import { PieceAuth } from '@activepieces/pieces-framework';

export const runwayAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
});


