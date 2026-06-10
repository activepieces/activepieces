import { PieceAuth } from '@activepieces/pieces-framework';

export const codaAuth = PieceAuth.SecretText({
	displayName: 'Coda API Key',
	description: `Create an API key in the [Coda Account dashboard](https://coda.io/account).`,
	required: true,
});
