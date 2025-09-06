import { PieceAuth } from '@activepieces/pieces-framework';

export const lemlistAuth = PieceAuth.SecretText({
  displayName: 'Lemlist API Key',
  description: `
    Enter your Lemlist API key.  
    You can find it in Lemlist → Settings → Integrations → API.  
    (username left empty, password = API key).
  `,
  required: true,
});
