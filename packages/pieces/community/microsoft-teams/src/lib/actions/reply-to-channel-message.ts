import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsGetChannelMessageOutputSchema } from '../output-schemas';

export const replyToChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_reply_to_channel_message',
	outputSchema: microsoftTeamsGetChannelMessageOutputSchema,
	classification: 'WRITE',
	displayName: 'Reply to Channel Message',
	description: 'Post a reply to an existing channel message.',
	audience: 'human',
	aiMetadata: {
		description: 'Posts a reply under an existing channel message thread in Microsoft Teams, identified by team ID, channel ID, and the parent message ID. Use to respond within a thread rather than start a new top-level message. Not idempotent — each call adds another reply.',
		idempotent: false,
	},
	propertyGroups: [
		{ key: 'destination', display: 'section', label: 'Reply To', icon: 'reply', props: ['teamId', 'channelId', 'messageId'] },
		{ key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['contentType', 'content'] },
	],
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelId: microsoftTeamsProps.channelId({ required: true }),
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'The ID of the message to reply to.',
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Format',
			required: true,
			defaultValue: 'text',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text', description: 'Plain text', icon: 'text' },
					{ label: 'HTML', value: 'html', description: 'HTML tags', icon: 'code' },
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


