import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { supabirdAuth } from './lib/auth';
import { SUPABIRD_API_URL } from './lib/common/client';
import { addPostingSlotAction } from './lib/actions/add-posting-slot';
import { createPostAction } from './lib/actions/create-post';
import { generatePostIdeasAction } from './lib/actions/generate-post-ideas';
import { getPostAction } from './lib/actions/get-post';
import { unschedulePostAction } from './lib/actions/unschedule-post';
import { newDraftTrigger } from './lib/triggers/new-draft';
import { newPublishedPostTrigger } from './lib/triggers/new-published-post';
import { newSavedIdeaTrigger } from './lib/triggers/new-saved-idea';
import { newScheduledPostTrigger } from './lib/triggers/new-scheduled-post';

export const supabird = createPiece({
  displayName: 'SupaBird',
  description:
    'Social media growth agent: generate post ideas and schedule posts on X, LinkedIn, Threads, Bluesky, Instagram and TikTok.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/supabird.png',
  categories: [PieceCategory.MARKETING],
  auth: supabirdAuth,
  authors: ['Farid18baku'],
  actions: [
    createPostAction,
    getPostAction,
    unschedulePostAction,
    generatePostIdeasAction,
    addPostingSlotAction,
    createCustomApiCallAction({
      baseUrl: () => SUPABIRD_API_URL,
      auth: supabirdAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    newScheduledPostTrigger,
    newPublishedPostTrigger,
    newDraftTrigger,
    newSavedIdeaTrigger,
  ],
});
