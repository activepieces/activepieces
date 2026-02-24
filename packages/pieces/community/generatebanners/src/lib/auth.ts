import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To obtain your GenerateBanners public and secret API Keys, you can follow the steps below:

1. Go to the [GenerateBanners homepage](https://www.generatebanners.com/).
2. Sign up or log in into your account.
3. Go to your [account page](https://www.generatebanners.com/app/account).
4. The public and secret API keys are now displayed, copy them one by one into the right Activepieces fields.
`;

export const generatebannersAuth = PieceAuth.BasicAuth({
  description: markdownDescription,
  required: true,
  username: {
    displayName: 'Public API Key',
  },
  password: {
    displayName: 'Secret API Key',
  },
});
