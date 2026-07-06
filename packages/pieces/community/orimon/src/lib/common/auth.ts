import { PieceAuth } from '@activepieces/pieces-framework';

export const orimonAuth = PieceAuth.SecretText({
  displayName: 'Orimon API Key',
  description: `
To get your Orimon API Key:

1. **Login to your Orimon Dashboard**
2. **Click the profile icon** (image icon) in the Top Right corner
3. **Select "Profile"** from the menu
4. **Click "Generate Your Secret Key"** to create a new API key
5. **Click the eye icon** to reveal your key
6. **Copy the key** and paste it here

For more details, visit: [Orimon Developer API Docs](https://orimon.gitbook.io/docs/developer-api/getting-started-with-apis)
  `,
  required: true,
  
});
