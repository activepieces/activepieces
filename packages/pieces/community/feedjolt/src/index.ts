import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { feedjoltAuth } from './lib/auth';
import { feedjoltCommon } from './lib/common';
import { listWorkspaces } from './lib/actions/list-workspaces';
import { listBoards } from './lib/actions/list-boards';
import { listPosts } from './lib/actions/list-posts';
import { getPost } from './lib/actions/get-post';
import { createPost } from './lib/actions/create-post';
import { updatePostStatus } from './lib/actions/update-post-status';
import { getRoadmap } from './lib/actions/get-roadmap';
import { getChangelog } from './lib/actions/get-changelog';
import { newPostTrigger } from './lib/triggers/new-post';

export const feedjolt = createPiece({
  displayName: 'Feedjolt',
  description: 'Connect Feedjolt feedback boards, posts, roadmap, and changelog.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/feedjolt.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: feedjoltAuth,
  authors: ['luodaint', 'mllopart'],
  actions: [
    listWorkspaces,
    listBoards,
    listPosts,
    getPost,
    createPost,
    updatePostStatus,
    getRoadmap,
    getChangelog,
    createCustomApiCallAction({
      baseUrl: () => feedjoltCommon.baseUrl,
      auth: feedjoltAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newPostTrigger],
});
