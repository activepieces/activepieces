import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { feedhiveAuth } from './lib/common/auth';
import { postNotificationTrigger } from './lib/triggers/post-notification';
import { commentNotificationTrigger } from './lib/triggers/comment-notification';
import { createPostAction } from './lib/actions/create-post';
import { updatePostAction } from './lib/actions/update-post';
import { getPostAction } from './lib/actions/get-post';
import { deletePostAction } from './lib/actions/delete-post';
import { listPostsAction } from './lib/actions/list-posts';
import { createLabelAction } from './lib/actions/create-label';
import { fireWorkflowTriggerAction } from './lib/actions/fire-workflow-trigger';

export { feedhiveAuth };

export const feedhive = createPiece({
  displayName: 'FeedHive',
  description: 'Schedule, manage and publish social media content with FeedHive.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/feedhive.png',
  categories: [PieceCategory.MARKETING],
  auth: feedhiveAuth,
  authors: [],
  actions: [
    createPostAction,
    updatePostAction,
    getPostAction,
    deletePostAction,
    listPostsAction,
    createLabelAction,
    fireWorkflowTriggerAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.feedhive.com',
      auth: feedhiveAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as unknown as string}`,
      }),
    }),
  ],
  triggers: [postNotificationTrigger, commentNotificationTrigger],
});
