import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { findUserByCustomFieldAction } from './lib/actions/find-user-by-custom-field';
import { createSubscriberAction } from './lib/actions/create-subscriber';
import { sendContentToUserAction } from './lib/actions/send-content-to-user';
import { setCustomFieldAction } from './lib/actions/set-custom-fields';
import { removeTagFromUserAction } from './lib/actions/remove-tag-from-user';
import { addTagToUserAction } from './lib/actions/add-tag-to-user';
import { findUserByNameAction } from './lib/actions/find-user-by-name';
import { getSubscriberAction } from './lib/actions/get-subscriber';
import { findSubscriberByEmailOrPhoneAction } from './lib/actions/find-subscriber-by-email-or-phone';
import { updateSubscriberAction } from './lib/actions/update-subscriber';
import { sendFlowAction } from './lib/actions/send-flow';
import { createTagAction } from './lib/actions/create-tag';
import { createCustomFieldAction } from './lib/actions/create-custom-field';
import { manychatAiActions } from './lib/actions/ai';
import { manychatAuth } from './lib/auth';

export const manychat = createPiece({
	displayName: 'Manychat',
	description: 'Automations for Instagram, WhatsApp, TikTok, and Messenger marketing.',
	categories: [PieceCategory.MARKETING],
	auth: manychatAuth,
	minimumSupportedRelease: '0.86.4',
	logoUrl: 'https://cdn.activepieces.com/pieces/manychat.png',
	authors: ['neo773', 'kishanprmr', 'OdaiAhmed99'],
	actions: [
		addTagToUserAction,
		createSubscriberAction,
		findUserByCustomFieldAction,
		findUserByNameAction,
		removeTagFromUserAction,
		sendContentToUserAction,
		setCustomFieldAction,
		getSubscriberAction,
		findSubscriberByEmailOrPhoneAction,
		updateSubscriberAction,
		sendFlowAction,
		createTagAction,
		createCustomFieldAction,
		...manychatAiActions,
	],
	triggers: [],
});
