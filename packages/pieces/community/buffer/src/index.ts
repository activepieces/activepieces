import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { bufferAuth } from './lib/common/auth';
import { bufferClient } from './lib/common/client';
import { createPost } from './lib/actions/create-post';
import { createIdea } from './lib/actions/create-idea';
import { newChannel } from './lib/triggers/new-channel';
import { newQueueItem } from './lib/triggers/new-queue-item';
import { newSentItem } from './lib/triggers/new-sent-item';

export const buffer = createPiece({
  displayName: 'Buffer',
  description:
    'Schedule, publish and analyze social media posts across multiple channels with Buffer.',
  auth: bufferAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/buffer.png',
  categories: [PieceCategory.MARKETING],
  authors: ['sanket-a11y'],
  actions: [
    createPost,
    createIdea,
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
