
import { createPiece } from '@activepieces/pieces-framework';
import { postStatus } from './lib/actions/post-status';

export const mastodon = createPiece({
  displayName: 'Mastodon',
  logoUrl: 'https://cdn.activepieces.com/pieces/mastodon.png',
  minimumSupportedRelease: '0.3.9',
  authors: [
    "abuaboud"
  ],
  actions: [
    postStatus
  ],
  triggers: [
  ],
});
