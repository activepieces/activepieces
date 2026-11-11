import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { bufferAuth } from './lib/common/auth';
import { bufferClient } from './lib/common/client';
import { createPost } from './lib/actions/create-post';
import { createIdea } from './lib/actions/create-idea';
import { listOrganizations } from './lib/actions/ai/list-organizations';
import { listChannels } from './lib/actions/ai/list-channels';
import { getChannel } from './lib/actions/ai/get-channel';
import { listPosts } from './lib/actions/ai/list-posts';
import { getPost } from './lib/actions/ai/get-post';
import { createPostAi } from './lib/actions/ai/create-post-ai';
import { editPost } from './lib/actions/ai/edit-post';
import { deletePost } from './lib/actions/ai/delete-post';
import { listIdeas } from './lib/actions/ai/list-ideas';
import { listIdeaGroups } from './lib/actions/ai/list-idea-groups';
import { getPostMetrics } from './lib/actions/ai/get-post-metrics';
import { listTags } from './lib/actions/ai/list-tags';
import { newChannel } from './lib/triggers/new-channel';
import { newQueueItem } from './lib/triggers/new-queue-item';
import { newSentItem } from './lib/triggers/new-sent-item';

export const buffer = createPiece({
  displayName: 'Buffer',
  description:
    'Schedule, publish and analyze social media posts across multiple channels with Buffer.',
  auth: bufferAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/buffer.png',
  categories: [PieceCategory.MARKETING],
  authors: ['sanket-a11y', 'OdaiAhmed99'],
  actions: [
    createPost,
    createIdea,
    listOrganizations,
    listChannels,
    getChannel,
    listPosts,
    getPost,
    createPostAi,
    editPost,
    deletePost,
    listIdeas,
    listIdeaGroups,
    getPostMetrics,
    listTags,
    createCustomApiCallAction({
      baseUrl: () => bufferClient.apiUrl,
      auth: bufferAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newChannel, newQueueItem, newSentItem],
});
