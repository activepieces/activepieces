import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `To get your API key:
1. Open your [Chatbase dashboard](https://www.chatbase.co/dashboard).
2. Go to **Workspace Settings** → **API Keys**.
3. Create a key and copy it here.

API access needs a Chatbase Basic plan or higher.`;

export const chatbaseAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
});
