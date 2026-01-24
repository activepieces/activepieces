import { PieceAuth } from '@activepieces/pieces-framework';

const authHelpDescription = `
1. Login to your Pushbullet Dashboard.
2. Go to **https://www.pushbullet.com/#settings/account**.
3.  **Create Access Token** then copy to the clipboard and paste it.`;

export const bushbulletAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription,
  required: true,
});
