import { PieceAuth } from '@activepieces/pieces-framework';

export const ForeplayAuth = PieceAuth.SecretText({
    displayName: 'Foreplay API Key',
    description: `**Enter your Foreplay API Key**
  
To obtain your API key:
1. Log in to your Foreplay account
2. Navigate to your account settings
3. Look for the API section and generate a new key
`,
    required: true,
    
});
