import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To use Transkriptor, you need an API key:
1. Sign up or log in at [app.transkriptor.com](https://app.transkriptor.com).
2. Go to **Settings** → **My Account**.
3. Copy the **API Key** shown on the page.
`;

export const transkriptorAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});
