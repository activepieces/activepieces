import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createPost } from './lib/actions/create-post';
import { listPosts } from './lib/actions/list-posts';
import { deletePost } from './lib/actions/delete-post';
import { listIntegrations } from './lib/actions/list-integrations';
import { findAvailableSlot } from './lib/actions/find-available-slot';
import { getPlatformAnalytics } from './lib/actions/get-platform-analytics';
import { getPostAnalytics } from './lib/actions/get-post-analytics';
import { uploadFileFromUrl } from './lib/actions/upload-file-from-url';
import { newPost } from './lib/triggers/new-post';
import { postizAuth } from './lib/common/auth';

export const postiz = createPiece({
  displayName: 'Postiz',
  description:
    'Open-source social media scheduling tool supporting 30+ platforms',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/postiz.png',
  categories: [PieceCategory.MARKETING],
  auth: postizAuth,
  authors: ['bst1n', 'onyedikachi-david'],
  actions: [
    createPost,
    listPosts,
    deletePost,
    listIntegrations,
    findAvailableSlot,
    getPlatformAnalytics,
    getPostAnalytics,
    uploadFileFromUrl,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const { base_url } = (auth as { props: { base_url: string; api_key: string } }).props;
        return base_url?.trim().replace(/\/+$/, '');
      },
      auth: postizAuth,
      authMapping: async (auth) => ({
        Authorization: (auth as { props: { base_url: string; api_key: string } }).props.api_key,
      }),
    }),
  ],
  triggers: [newPost],
});

export { postizAuth } from './lib/common/auth';
