import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
1. Log in to [GenerateBanners](https://www.generatebanners.com/).
2. Open your [account page](https://www.generatebanners.com/app/account).
3. Copy the public and secret API keys into the fields below.
`;

export const generatebannersAuth = PieceAuth.BasicAuth({
  description: markdownDescription,
  required: true,
  username: {
    displayName: 'Public API Key',
    description: 'Shown on your GenerateBanners account page.',
  },
  password: {
    displayName: 'Secret API Key',
    description: 'Shown next to the public key; keep it private.',
  },
});
