import { PieceAuth } from '@activepieces/pieces-framework';

const markdown = `
1.Log into your monday.com account.\n
2.Click on your avatar/profile picture in the top right corner.\n
3.Select **Administration** (this requires you to have admin permissions).\n
4.Go to the **API** section.\n
5.Copy your personal token`;

export const mondayAuth = PieceAuth.SecretText({
  displayName: 'API v2 Token',
  description: markdown,
  required: true,
});
