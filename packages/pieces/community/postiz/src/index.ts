import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createPost } from './lib/actions/create-post';
import { listPosts } from './lib/actions/list-posts';
import { deletePost } from './lib/actions/delete-post';
import { listIntegrations } from './lib/actions/list-integrations';
import { findAvailableSlot } from './lib/actions/find-available-slot';
import { getPlatformAnalytics } from './lib/actions/get-platform-analytics';
import { getPostAnalytics } from './lib/actions/get-post-analytics';
import { uploadFileFromUrl } from './lib/actions/upload-file-from-url';
import { aiCreateDraftPost } from './lib/actions/ai-create-draft-post';
import { aiSchedulePost } from './lib/actions/ai-schedule-post';
import { aiPublishPostNow } from './lib/actions/ai-publish-post-now';
import { changePostStatus } from './lib/actions/change-post-status';
import { getChannelSettings } from './lib/actions/get-channel-settings';
import { listMedia } from './lib/actions/list-media';
import { newPost } from './lib/triggers/new-post';
import { normalizeBaseUrl, postizAuth } from './lib/common/auth';

export const postiz = createPiece({
  displayName: 'Postiz',
  description:
    'Open-source social media scheduling tool supporting 30+ platforms',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/postiz.png',
  categories: [PieceCategory.MARKETING],
  auth: postizAuth,
  authors: ['bst1n', 'onyedikachi-david'],
  actions: [
    createPost,
    aiCreateDraftPost,
    aiSchedulePost,
    aiPublishPostNow,
    changePostStatus,
    listPosts,
    deletePost,
    listIntegrations,
    getChannelSettings,
    findAvailableSlot,
    getPlatformAnalytics,
    getPostAnalytics,
    uploadFileFromUrl,
    listMedia,
    createCustomApiCallAction({
      baseUrl: (auth) => normalizeBaseUrl({ baseUrl: auth?.props.base_url }),
      auth: postizAuth,
      authMapping: async (auth) => ({
        Authorization: auth.props.api_key,
      }),
    }),
  ],
  triggers: [newPost],
});

export { postizAuth } from './lib/common/auth';
