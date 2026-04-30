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
import { publishDraftNowAction } from './lib/actions/publish-draft-now.action';
import { scheduleDraftAction } from './lib/actions/schedule-draft.action';
import { uploadMediaAction } from './lib/actions/upload-media.action';
import { newEventTrigger } from './lib/triggers/new-event.trigger';

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
		publishDraftNowAction,
		scheduleDraftAction,
		getDraftAction,
		listDraftsAction,
		deleteDraftAction,
		uploadMediaAction,
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
		newEventTrigger,
	],
});
