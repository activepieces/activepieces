import { PieceAuth } from '@activepieces/pieces-framework';

const markdown = `
1. Open https://discord.com/developers/applications and select or create an application.
2. In **Bot**, click **Reset Token** and copy the token.
3. Still in **Bot**, enable **Server Members Intent** and **Message Content Intent**.
4. In **OAuth2 → URL Generator**, pick the **bot** scope and the permissions you need, open the URL and add the bot to your server.
`;

export const discordAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdown,
  required: true,
});
