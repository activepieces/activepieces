import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';

export const replyToChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_reply_to_channel_message',
	classification: 'WRITE',
	displayName: 'Reply to Channel Message',
	description: 'Post a reply to an existing channel message.',
	audience: 'both',
	aiMetadata: {
		description: 'Posts a reply under an existing channel message thread in Microsoft Teams, identified by team ID, channel ID, and the parent message ID. Use to respond within a thread rather than start a new top-level message. Not idempotent — each call adds another reply.',
		idempotent: false,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelId: microsoftTeamsProps.channelId({ required: true }),
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'ID of the parent message to reply to.'
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Message',
			required: true,
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId, contentType, content } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const chatMessage = {
			body: {
				content: content,
				contentType: contentType,
			},
		};

		return await microsoftTeamsClient.withRetry(() =>
			client
				.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
				.post(chatMessage)
		);
	},
});


