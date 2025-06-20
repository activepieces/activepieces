import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const microsoftOutlookAuth = PieceAuth.OAuth2({
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	required: true,
	scope: [
		'https://graph.microsoft.com/Mail.ReadWrite', // Needed for modifying emails (createReply)
		'https://graph.microsoft.com/Mail.Send', // Needed for sending emails
		'offline_access', // Needed for refresh tokens
	  ],
	validate: async ({ auth }) => {
		try {
			const authValue = auth as OAuth2PropertyValue;
			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});
			await client.api('/me').get();
			return { valid: true };
		} catch (error) {
			return { valid: false, error: 'Invalid Credentials.' };
		}
	},
});
