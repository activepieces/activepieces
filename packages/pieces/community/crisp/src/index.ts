import { createPiece, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { crispAuth } from './lib/common/auth';
import { createConversationAction } from './lib/actions/create-conversation';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';
import { addNoteToConversationAction } from './lib/actions/add-note-to-conversation';
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact';
import { findUserProfileAction } from './lib/actions/find-user-profile';
import { updateConversationStateAction } from './lib/actions/update-conversation-state';
import { findConversationAction } from './lib/actions/find-conversation';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newConversationTrigger } from './lib/triggers/new-conversation';
import { PieceCategory } from '@activepieces/shared';

export const crisp = createPiece({
	displayName: 'Crisp',
	auth: crispAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/crisp.png',
	authors: ['kishanprmr','Ani-4x'],
	categories:[PieceCategory.CUSTOMER_SUPPORT],
	actions: [
		addNoteToConversationAction,
		createConversationAction,
		createOrUpdateContactAction,
		updateConversationStateAction,
		findConversationAction,
		findUserProfileAction,
		createCustomApiCallAction({
			auth: crispAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				const authValue = auth as PiecePropValueSchema<typeof crispAuth>;
				return {
					Authorization: `Basic ${Buffer.from(
						`${authValue.identifier}:${authValue.token}`,
					).toString('base64')}`,
					'X-Crisp-Tier': 'plugin',
					'Content-Type': 'application/json',
				};
			},
		}),
	],
	triggers: [newContactTrigger,newConversationTrigger],
});
