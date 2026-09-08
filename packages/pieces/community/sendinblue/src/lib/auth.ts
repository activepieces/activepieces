import { PieceAuth } from '@activepieces/pieces-framework';

export const sendinblueAuth = PieceAuth.SecretText({
	displayName: 'Project API key',
	description: 'Your project API key',
	required: true,
});
