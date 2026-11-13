import { PieceAuth } from '@activepieces/pieces-framework';

export const sendinblueAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your API key:
1. Log in to Brevo.
2. Open the account menu, go to **SMTP & API** and open the **API Keys** tab.
3. Click **Generate a new API key**, name it and copy the key.`,
	required: true,
});
