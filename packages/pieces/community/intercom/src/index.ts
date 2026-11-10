import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import {
	getIntercomBaseUrl,
	getIntercomRegion,
	getIntercomToken,
} from './lib/common';
import { sendMessageAction } from './lib/actions/send-message.action';
import crypto from 'node:crypto';
import { noteAddedToConversation } from './lib/triggers/note-added-to-conversation';
import { addNoteToConversationAction } from './lib/actions/add-note-to-conversation';
import { replyToConversation } from './lib/actions/reply-to-conversation';
import { newConversationFromUser } from './lib/triggers/new-conversation-from-user';
import { replyFromUser } from './lib/triggers/reply-from-user';
import { replyFromAdmin } from './lib/triggers/reply-from-admin';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { conversationClosedTrigger } from './lib/triggers/conversation-closed';
import { conversationSnoozed } from './lib/triggers/conversation-snoozed';
import { conversationUnsnoozed } from './lib/triggers/conversation-unsnoozed';
import { conversationRated } from './lib/triggers/conversation-rated';
import { conversationPartTagged } from './lib/triggers/conversation-part-tagged';
import { findConversationAction } from './lib/actions/find-conversation';
import { addNoteToUserAction } from './lib/actions/add-note-to-user';
import { findUserAction } from './lib/actions/find-user';
import { findLeadAction } from './lib/actions/find-lead';
import { addOrRemoveTagOnConversationAction } from './lib/actions/add-remove-tag-on-conversation';
import { addOrRemoveTagOnCompanyAction } from './lib/actions/add-remove-tag-on-company';
import { createUserAction } from './lib/actions/create-user';
import { createOrUpdateUserAction } from './lib/actions/create-update-user';
import { listAllTagsAction } from './lib/actions/list-all-tags';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newCompanyTrigger } from './lib/triggers/new-company';
import { addOrRemoveTagOnContactAction } from './lib/actions/add-remove-tag-on-contact';
import { createArticleAction } from './lib/actions/create-article';
import { createConversationAction } from './lib/actions/create-conversation';
import { getConversationAction } from './lib/actions/get-conversation';
import { createOrUpdateLeadAction } from './lib/actions/create-update-lead';
import { createTicketAction } from './lib/actions/create-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { findCompanyAction } from './lib/actions/find-company';
import { leadAddedEmailTrigger } from './lib/triggers/lead-added-email';
import { newTicketTrigger } from './lib/triggers/new-ticket';
import { tagAddedToLeadTrigger } from './lib/triggers/tag-added-to-lead';
import { contactRepliedTrigger } from './lib/triggers/contact-replied';
import { leadConvertedToUserTrigger } from './lib/triggers/lead-converted-to-user';
import { newUserTrigger } from './lib/triggers/new-user';
import { tagAddedToUserTrigger } from './lib/triggers/tag-added-to-user';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';
import { intercomAuth } from './lib/auth';
import { assignConversationAction } from './lib/actions/assign-conversation-to-admin';
import { createOrUpdateCompanyAction } from './lib/actions/create-update-company';
import { createDataEventAction } from './lib/actions/create-data-event';
import { findOrCreateCompanyAction } from './lib/actions/find-or-create-company';
import { findOrCreateLeadAction } from './lib/actions/find-or-create-lead';
import { updatedTicketTrigger } from './lib/triggers/updated-ticket';
import { newUnsubscriptionTrigger } from './lib/triggers/new-unsubscription';
import { getConversationByIdAction } from './lib/actions/ai/get-conversation-by-id';
import { replyToConversationByIdAction } from './lib/actions/ai/reply-to-conversation-by-id';
import { addNoteToConversationByIdAction } from './lib/actions/ai/add-note-to-conversation-by-id';
import { assignConversationByIdAction } from './lib/actions/ai/assign-conversation-by-id';
import { tagOrUntagRecordAction } from './lib/actions/ai/tag-or-untag-record';
import { sendMessageToContactAction } from './lib/actions/ai/send-message-to-contact';
import { createTicketByTypeIdAction } from './lib/actions/ai/create-ticket-by-type-id';
import { updateTicketByIdAction } from './lib/actions/ai/update-ticket-by-id';
import { getContactAction } from './lib/actions/get-contact';
import { searchContactsAction } from './lib/actions/search-contacts';
import { updateContactAction } from './lib/actions/update-contact';
import { attachContactToCompanyAction } from './lib/actions/attach-contact-to-company';
import { listContactNotesAction } from './lib/actions/list-contact-notes';
import { searchConversationsAction } from './lib/actions/search-conversations';
import { setConversationStateAction } from './lib/actions/set-conversation-state';
import { convertConversationToTicketAction } from './lib/actions/convert-conversation-to-ticket';
import { getTicketAction } from './lib/actions/get-ticket';
import { searchTicketsAction } from './lib/actions/search-tickets';
import { replyToTicketAction } from './lib/actions/reply-to-ticket';
import { listTicketTypesAction } from './lib/actions/list-ticket-types';
import { listAdminsAction } from './lib/actions/list-admins';
import { listTeamsAction } from './lib/actions/list-teams';
import { listDataAttributesAction } from './lib/actions/list-data-attributes';
import { createTagAction } from './lib/actions/create-tag';
import { getCompanyAction } from './lib/actions/get-company';
import { listCompaniesAction } from './lib/actions/list-companies';
import { searchArticlesAction } from './lib/actions/search-articles';
import { listSegmentsAction } from './lib/actions/ai/list-segments';
import { addNoteToContactAction } from './lib/actions/ai/add-note-to-contact';
import { createConversationFromContactAction } from './lib/actions/ai/create-conversation-from-contact';
import { createHelpCenterArticleAction } from './lib/actions/ai/create-help-center-article';

export const intercom = createPiece({
	displayName: 'Intercom',
	description: 'Customer messaging platform for sales, marketing, and support',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
	categories: [PieceCategory.CUSTOMER_SUPPORT],
	auth: intercomAuth,
	authors: [
		'kishanprmr',
		'MoShizzle',
		'AbdulTheActivePiecer',
		'khaledmashaly',
		'abuaboud',
		'AdamSelene',
		'HeleneGaspar',
	],
	actions: [
		addNoteToUserAction,
		addNoteToConversationAction,
		addOrRemoveTagOnContactAction,
		addOrRemoveTagOnCompanyAction,
		addOrRemoveTagOnConversationAction,
		assignConversationAction,
		createArticleAction,
		createConversationAction,
		createDataEventAction,
		createTicketAction,
		createUserAction,
		createOrUpdateCompanyAction,
		createOrUpdateLeadAction,
		createOrUpdateUserAction,
		replyToConversation,
		sendMessageAction,
		updateTicketAction,
		findCompanyAction,
		findConversationAction,
		findLeadAction,
		findOrCreateCompanyAction,
		findOrCreateLeadAction,
		findUserAction,
		listAllTagsAction,
		getConversationAction,
		getConversationByIdAction,
		replyToConversationByIdAction,
		addNoteToConversationByIdAction,
		assignConversationByIdAction,
		tagOrUntagRecordAction,
		sendMessageToContactAction,
		createTicketByTypeIdAction,
		updateTicketByIdAction,
		getContactAction,
		searchContactsAction,
		updateContactAction,
		attachContactToCompanyAction,
		listContactNotesAction,
		searchConversationsAction,
		setConversationStateAction,
		convertConversationToTicketAction,
		getTicketAction,
		searchTicketsAction,
		replyToTicketAction,
		listTicketTypesAction,
		listAdminsAction,
		listTeamsAction,
		listDataAttributesAction,
		createTagAction,
		getCompanyAction,
		listCompaniesAction,
		searchArticlesAction,
		listSegmentsAction,
		addNoteToContactAction,
		createConversationFromContactAction,
		createHelpCenterArticleAction,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				if (!auth) {
					throw new Error('Connect Intercom first.');
				}
				return getIntercomBaseUrl(getIntercomRegion(auth));
			},
			auth: intercomAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${getIntercomToken(auth)}`,
			}),
		}),
	],
	triggers: [
		contactRepliedTrigger,
		leadAddedEmailTrigger,
		leadConvertedToUserTrigger,
		conversationClosedTrigger,
		conversationAssigned,
		conversationSnoozed,
		conversationUnsnoozed,
		newCompanyTrigger,
		newConversationFromUser,
		conversationRated,
		newLeadTrigger,
		newTicketTrigger,
		newUnsubscriptionTrigger,
		newUserTrigger,
		updatedTicketTrigger,
		conversationPartTagged,
		tagAddedToLeadTrigger,
		tagAddedToUserTrigger,
		contactUpdatedTrigger,
		replyFromUser,
		replyFromAdmin,
		noteAddedToConversation,
	],
	events: {
		parseAndReply: ({ payload }) => {
			const payloadBody = readPayloadBody(payload.body);
			return {
				event: payloadBody?.topic,
				identifierValue: payloadBody?.app_id,
			};
		},
		verify: ({ payload, webhookSecret }) => {
			const signature = payload.headers['x-hub-signature'];
			const secret = resolveWebhookSecret({
				webhookSecret,
				appId: readPayloadBody(payload.body)?.app_id,
			});
			if (typeof signature !== 'string' || secret === undefined) {
				return false;
			}
			const expected = `sha1=${crypto.createHmac('sha1', secret).update(`${payload.rawBody}`).digest('hex')}`;
			const given = Buffer.from(signature);
			const wanted = Buffer.from(expected);
			return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
		},
	},
});

function resolveWebhookSecret({
	webhookSecret,
	appId,
}: {
	webhookSecret: unknown;
	appId: string | undefined;
}): string | undefined {
	if (typeof webhookSecret === 'string') {
		return webhookSecret;
	}
	if (typeof webhookSecret !== 'object' || webhookSecret === null || appId === undefined) {
		return undefined;
	}
	const secret = Object.prototype.hasOwnProperty.call(webhookSecret, appId)
		? Reflect.get(webhookSecret, appId)
		: undefined;
	return typeof secret === 'string' ? secret : undefined;
}

function readPayloadBody(body: unknown): PayloadBody | undefined {
	if (typeof body !== 'object' || body === null) {
		return undefined;
	}
	const topic = Reflect.get(body, 'topic');
	const appId = Reflect.get(body, 'app_id');
	return {
		topic: typeof topic === 'string' ? topic : undefined,
		app_id: typeof appId === 'string' ? appId : undefined,
	};
}

type PayloadBody = {
	topic: string | undefined;
	app_id: string | undefined;
};
