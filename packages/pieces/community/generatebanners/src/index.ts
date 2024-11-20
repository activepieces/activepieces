import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { renderTemplate } from './lib/actions/renderTemplate.action';

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

export const generatebanners = createPiece({
  displayName: 'GenerateBanners',
  description: 'Image generation API for banners and social media posts',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/generatebanners.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["tpatel","kishanprmr","khaledmashaly","abuaboud"],
  auth: generatebannersAuth,
  actions: [renderTemplate],
  triggers: [],
});
