import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';

export const cursorAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
User API Keys provide secure, programmatic access to your Cursor account, including the Cloud Agent API.

To get your API Key:
1. Go to cursor.com/dashboard?tab=cloud-agents
2. Scroll to the "User API Keys" section
3. Click "+ New API Key"
4. Copy the generated key (format: key_...)

Treat your API key like a password: keep it secure and never share it publicly.
Note: The Cloud Agent API is in beta.
  `,
  required: true,
});

export type CursorAuth = AppConnectionValueForAuthProperty<typeof cursorAuth>;

