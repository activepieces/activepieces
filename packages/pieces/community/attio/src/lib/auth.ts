import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To use Attio, you need to generate an Access Token:
1. Login to your Attio account at https://app.attio.com.
2. From the dropdown beside your workspace name, click Workspace settings.
3. Click the Developers tab.
4. Click on the "New Access Token" button.
5. Set the appropriate Scopes for the integration.
6. Copy the generated Access Token.
`;

export const attioAuth = PieceAuth.SecretText({
	displayName: 'Access Token',
	description: markdownDescription,
	required: true,
});
