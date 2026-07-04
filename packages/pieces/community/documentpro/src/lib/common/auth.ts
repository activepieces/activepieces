import { PieceAuth } from '@activepieces/pieces-framework';

export const documentproAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your DocumentPro API Key:

1. **Login** to your DocumentPro account
2. **Go to** https://app.documentpro.ai/workflows
3. **Select** a workflow
4. **Change tab** to "Workflow" from the top bar
5. **Find** the "Upload" tab
6. **Click** "Upload via API"
7. **Click** the "Generate API Key" button
8. **Copy** your API key and paste it here
  `,
  required: true,
});
