import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { encodeVideoAction } from './lib/actions/encode-video';

export const slashedAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your Bearer Token from the slashed.cloud dashboard. Go to your service settings to find or generate it.',
  required: true,
  validate: async ({ auth }: { auth: string }) => {
    if (auth && auth.trim().length > 0) {
      return { valid: true };
    }
    return { valid: false, error: 'API Token must not be empty.' };
  },
});

export const slashed = createPiece({
  displayName: 'SlashedCloud',
  description: 'AV1 video encoding and transcoding via slashed.cloud.',
  auth: slashedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/slashed.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['sanket-a11y'],
  actions: [
    encodeVideoAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://venc.slashed.cloud',
      auth: slashedAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
