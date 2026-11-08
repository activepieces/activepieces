import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { letmepostAuth } from './lib/common/auth';
import { letmepostClient } from './lib/common/client';
import { publishPost } from './lib/actions/publish-post';
import { publishPostAi } from './lib/actions/publish-post-ai';
import { getPost } from './lib/actions/get-post';
import { listAccounts } from './lib/actions/list-accounts';
import { listMedia } from './lib/actions/list-media';
import { listPosts } from './lib/actions/list-posts';
import { cancelPost } from './lib/actions/cancel-post';
import { reschedulePost } from './lib/actions/reschedule-post';
import { getAccount } from './lib/actions/get-account';
import { uploadMedia } from './lib/actions/upload-media';
import { listPinterestBoards } from './lib/actions/list-pinterest-boards';
import { replyToPost } from './lib/actions/reply-to-post';
import { newPublishedPost } from './lib/triggers/new-published-post';
import { postEvent } from './lib/triggers/post-event';

export const letmepost = createPiece({
  displayName: 'Letmepost',
  description:
    'Publish and schedule posts to Bluesky, X, LinkedIn, Instagram, Threads, Facebook, Pinterest, and TikTok through one API',
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/letmepost.png',
  categories: [PieceCategory.MARKETING],
  auth: letmepostAuth,
  authors: ['rosekamallove', 'sanket-a11y'],
  actions: [
    publishPost,
    publishPostAi,
    replyToPost,
    getPost,
    listPosts,
    reschedulePost,
    cancelPost,
    listAccounts,
    getAccount,
    listMedia,
    uploadMedia,
    listPinterestBoards,
    createCustomApiCallAction({
      baseUrl: (auth) => letmepostClient.displayBaseUrl(auth?.props.base_url),
      auth: letmepostAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${letmepostClient.optionalText(auth.props.api_key) ?? ''}`,
      }),
    }),
  ],
  triggers: [newPublishedPost, postEvent],
});
