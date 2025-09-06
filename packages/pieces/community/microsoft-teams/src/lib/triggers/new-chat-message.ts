import { microsoftTeamsAuth } from '../../index';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

type Props = {
	chatId: string;
};

interface WebhookInformation {
	subscriptionId: string;
}

export const newChatMessageTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat-message',
	displayName: 'New Chat Message',
	description: 'Fires when a new message is received in a chat.',
	props: {
		chatId: microsoftTeamsCommon.chatId,
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { auth, propsValue, webhookUrl } = context;
		const { chatId } = propsValue as Props;
		
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		// Create subscription for chat messages using Microsoft Graph change notifications
		const subscription = await client.api('/subscriptions').post({
			changeType: 'created',
			notificationUrl: webhookUrl,
			resource: `/chats/${chatId}/messages`,
			expirationDateTime: new Date(Date.now() + 4230 * 60 * 1000), // Max 3 days
			clientState: 'activepieces-chat-message-trigger'
		});

		await context.store?.put<WebhookInformation>('_new_chat_message_trigger', {
			subscriptionId: subscription.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>('_new_chat_message_trigger');

		if (response?.subscriptionId) {
			const { auth } = context;
			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(auth.access_token),
				},
			});

			try {
				await client.api(`/subscriptions/${response.subscriptionId}`).delete();
			} catch (error) {
				console.error('Error deleting subscription:', error);
			}
		}
	},
	async run(context) {
		return [context.payload.body];
	},
	sampleData: {
		id: '1747831213175',
		replyToId: null,
		etag: '1747831213175',
		messageType: 'message',
		createdDateTime: '2024-01-15T10:30:00.000Z',
		lastModifiedDateTime: '2024-01-15T10:30:00.000Z',
		lastEditedDateTime: null,
		deletedDateTime: null,
		subject: 'Hello Team!',
		summary: null,
		chatId: '19:meeting_M2IzYzczNTItYmY3OC00MDlmLWJjMzUtYmFiMjNlOTY4MGEz@thread.v2',
		importance: 'normal',
		locale: 'en-us',
		webUrl: 'https://teams.microsoft.com/l/message/19%3Ameeting_M2IzYzczNTItYmY3OC00MDlmLWJjMzUtYmFiMjNlOTY4MGEz%40thread.v2/1747831213175?groupId=99cb9-7ebe-43ee-a69b-5f77ce8a4b4e&tenantId=12345678-1234-1234-1234-123456789012&createdTime=1747831213175&parentMessageId=1747831213175',
		policyViolation: null,
		eventDetail: null,
		from: {
			application: null,
			device: null,
			user: {
				'@odata.type': '#microsoft.graph.teamworkUserIdentity',
				id: '90b3720d-f459-42c1-a02e-a1ecb068',
				displayName: 'John Doe',
				userIdentityType: 'aadUser',
				tenantId: '9b37335a-d996-4a8d-9ae4-a3a04c94',
			},
		},
		body: {
			contentType: 'html',
			content: '<p>Hello team! How is everyone doing today?</p>',
		},
		channelIdentity: null,
		attachments: [],
		mentions: [],
		reactions: [],
	},
});
