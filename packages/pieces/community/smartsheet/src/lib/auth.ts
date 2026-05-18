import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const markdownDescription = `
To obtain your Smartsheet access token:

1. Sign in to your Smartsheet account.
2. Click on your profile picture in the top right corner.
3. Select **Personal Settings** from the dropdown menu.
4. In the left panel, click **API Access**.
5. Click **Generate new access token**.
6. Enter a name for your token (e.g., "Activepieces Integration").
7. Click **OK** to generate the token..
8. Copy the access token and paste it into the connection field.
`;

export const smartsheetAuth = PieceAuth.SecretText({
	displayName: 'Access Token',
	description: markdownDescription,
	required: true,
	validate: async ({ auth }) => {
		if (!auth) {
			return {
				valid: false,
				error: 'Access token is required',
			};
		}
		try {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: 'https://api.smartsheet.com/2.0/sheets',
				headers: {
					Authorization: `Bearer ${auth}`,
					'Content-Type': 'application/json',
				},
			};
			await httpClient.sendRequest(request);
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error:
					'Invalid access token, insufficient permissions, or region mismatch. Ensure token is for api.smartsheet.com.',
			};
		}
	},
});
