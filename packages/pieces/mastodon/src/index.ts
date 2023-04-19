
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { postStatus } from './lib/actions/post-status';

export const mastodon = createPiece({
  name: 'mastodon',
  displayName: 'Mastodon',
  logoUrl: 'https://cdn.activepieces.com/pieces/mastodon.png',
  version: packageJson.version,
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
