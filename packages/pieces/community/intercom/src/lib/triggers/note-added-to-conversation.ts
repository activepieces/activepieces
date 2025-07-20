import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { stripHtml } from 'string-strip-html';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';

export const noteAddedToConversation = createTrigger({
	// auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
	name: 'noteAddedToConversation',
	displayName: 'Note added to conversation',
	description: 'Triggers when a note is added to a conversation',
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword (optional)',
			required: false,
		}),
	},
	sampleData: undefined,
	auth: intercomAuth,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);

		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['conversation.admin.noted'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async run(context) {
		const keyword = context.propsValue.keyword;
		const payloadBody = context.payload.body as IntercomPayloadBodyType;
		if (
			!keyword ||
			payloadBody?.data?.item?.conversation_parts.conversation_parts.some((part) =>
				stripHtml(part.body)
					.result.split(/\s/)
					.some((word) => word === keyword),
			)
		) {
			return [payloadBody];
		}
		return [];
	},
});

type IntercomPayloadBodyType = {
	data: {
		item: {
			conversation_parts: {
				conversation_parts: {
					body: string;
				}[];
			};
		};
	};
};
