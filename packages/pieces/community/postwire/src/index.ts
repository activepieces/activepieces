import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { postwireAuth } from './lib/auth';
import { POSTWIRE_API } from './lib/common';
import { getAccount } from './lib/actions/get-account';
import { publish } from './lib/actions/publish';
import { schedulePost } from './lib/actions/schedule-post';
import { writeAndPublish } from './lib/actions/write-and-publish';

export { postwireAuth };

export const postwire = createPiece({
  displayName: 'PostWire',
  description:
    'Publish one idea natively to TikTok, Instagram, YouTube, LinkedIn, X, Facebook, Reddit, Bluesky, Mastodon, Telegram and Discord, rewritten per network rather than copied.',
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://postwire.io/icon-1024.png',
  categories: [PieceCategory.MARKETING],
  auth: postwireAuth,
  authors: ['renzom13'],
  actions: [
    writeAndPublish,
    publish,
    schedulePost,
    getAccount,
    createCustomApiCallAction({
      baseUrl: () => POSTWIRE_API,
      auth: postwireAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
        'X-PostWire-Source': 'activepieces',
      }),
    }),
  ],
  triggers: [],
});
