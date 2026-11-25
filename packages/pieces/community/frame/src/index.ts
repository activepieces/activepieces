import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { frameCommon } from './lib/common';
import { triggers } from './lib/triggers';

const markdownPropertyDescription = `
To get your developer token:
1. Go to [developer.frame.io/app/tokens](https://developer.frame.io/app/tokens) and sign in.
2. Click **Create a Token** and give it a description.
3. Click **Select all scopes**, so the triggers can register webhooks.
4. Submit, then copy the token and paste it here.
`;

export const frameAuth = PieceAuth.SecretText({
  displayName: 'Developer Token',
  description: markdownPropertyDescription,
  required: true,
});

export const frame = createPiece({
  displayName: 'Frame',
  description: 'Video review and collaboration platform',

  auth: frameAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/frameio.png',
  categories: [PieceCategory.MARKETING],
  authors: ["kanarelo","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => frameCommon.baseUrl,
      auth: frameAuth,
      props: {
        url: {
          description: `Full URL, or a path relative to ${frameCommon.baseUrl}`,
          placeholder: '/accounts',
        },
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers,
});
