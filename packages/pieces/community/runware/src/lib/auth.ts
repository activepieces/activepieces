import { PieceAuth } from '@activepieces/pieces-framework';

export const runwareAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: 'You can get the API key from your Runware account',
	required: true,
});
