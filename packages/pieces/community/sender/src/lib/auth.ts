import { PieceAuth } from '@activepieces/pieces-framework';

export const senderAuth = PieceAuth.SecretText({
	displayName: 'API Token',
	description: 'Enter your Sender API Token',
	required: true,
});
