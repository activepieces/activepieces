import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To use Copy AI, you need to get an API key:
1. Login to your account at https://copy.ai.
2. Click on Workflows in the left sidebar.
3. Click on any Workflow you have. You need to create a new Workflow, if you don't have one.
4. Click on the API tab.
5. Click the Copy button below WORKSPACE API KEY.
`;

export const copyAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
});
