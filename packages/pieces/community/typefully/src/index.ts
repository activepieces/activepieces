import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { typefullyAuth } from './lib/auth';
import { TYPEFULLY_API_URL } from './lib/common/client';
import { createDraftAction } from './lib/actions/create-draft.action';
import { createDraftAdvancedAction } from './lib/actions/create-draft-advanced.action';
import { getDraftAction } from './lib/actions/get-draft.action';
import { listDraftsAction } from './lib/actions/list-drafts.action';
import { deleteDraftAction } from './lib/actions/delete-draft.action';
import { scheduleDraftNextSlotAction } from './lib/actions/schedule-draft-next-slot.action';
import { draftCreatedTrigger } from './lib/triggers/draft-created.trigger';
import { draftScheduledTrigger } from './lib/triggers/draft-scheduled.trigger';
import { draftPublishedTrigger } from './lib/triggers/draft-published.trigger';
import { draftStatusChangedTrigger } from './lib/triggers/draft-status-changed.trigger';
import { draftTagsChangedTrigger } from './lib/triggers/draft-tags-changed.trigger';
import { draftDeletedTrigger } from './lib/triggers/draft-deleted.trigger';

export const typefully = createPiece({
  displayName: 'Typefully',
  description: 'Write, schedule, and publish social media content.',
  auth: typefullyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/typefully.png',
  authors: ['bst1n', 'sanket-a11y'],
  categories: [PieceCategory.MARKETING],
  actions: [
    createDraftAction,
    createDraftAdvancedAction,
    getDraftAction,
    listDraftsAction,
    deleteDraftAction,
    scheduleDraftNextSlotAction,
    createCustomApiCallAction({
      auth: typefullyAuth,
      baseUrl: () => TYPEFULLY_API_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [
    draftCreatedTrigger,
    draftScheduledTrigger,
    draftPublishedTrigger,
    draftStatusChangedTrigger,
    draftTagsChangedTrigger,
    draftDeletedTrigger,
  ],
});
