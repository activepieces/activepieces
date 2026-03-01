import { PieceAuth } from '@activepieces/pieces-framework';

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`;

export const discordAuth = PieceAuth.SecretText({
  displayName: 'Bot Token',
  description: markdown,
  required: true,
});
