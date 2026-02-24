import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To get your Synthesia API Key:

1. Go to the upper right corner of the Synthesia application and click on your account.
2. Select **Integrations**
3. Click on **Add** to add a new Synthesia API key.
4. Copy this key using the 3-dot button on the right side of your API key.
5. Paste it below.

**Note:** When you create an API key it will belong to your account, not the workspace.
`;

export const synthesiaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});
