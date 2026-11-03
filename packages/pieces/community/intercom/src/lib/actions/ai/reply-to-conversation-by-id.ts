import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { attachmentUrlList, requireText } from '../../common/lookups';
import { conversationOutputSchema } from '../../output-schemas';

export const replyToConversationByIdAction = createAction({
	auth: intercomAuth,
	name: 'reply_to_conversation_by_id',
	classification: 'WRITE',
	displayName: 'Reply to Conversation (by ID)',
	description: 'Posts an admin reply that the customer sees in a conversation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Posts a customer-visible admin reply in an existing conversation; Intercom may also email it to the contact. Use Add Note to Conversation (by ID) for internal remarks and Send Message to Contact to start a new thread. Each call posts a new reply, so retries duplicate.',
		idempotent: false,
	},
	props: {
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'The Intercom conversation ID.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Reply',
			description: 'The reply text. Simple HTML is allowed.',
			required: true,
		}),
		adminId: Property.ShortText({
			displayName: 'Admin ID',
			description: 'The admin who replies. Leave empty to reply as the admin who owns this connection (see List Admins).',
			required: false,
		}),
		attachmentUrls: Property.Array({
			displayName: 'Attachment URLs',
			description: 'Up to 10 public image URLs to attach.',
			required: false,
		}),
	},
	outputSchema: conversationOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const body = requireText({ label: 'Reply', value: context.propsValue.body });
		const attachmentUrls = attachmentUrlList(context.propsValue.attachmentUrls);
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations', conversationId, 'reply'],
			body: {
				message_type: 'comment',
				type: 'admin',
				admin_id: adminId,
				body,
				attachment_urls: attachmentUrls,
			},
			operation: 'reply to the conversation',
		});
	},
});
