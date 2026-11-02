import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsGetChannelMessageOutputSchema } from '../output-schemas';

export const getChannelMessageAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_channel_message',
	outputSchema: microsoftTeamsGetChannelMessageOutputSchema,
	classification: 'READ',
	displayName: 'Get Channel Message',
	description: 'Fetch a specific channel message by team, channel, and message ID (optionally a reply).',
	audience: 'human',
	aiMetadata: {
		description: 'Retrieves a single channel message from Microsoft Teams by team ID, channel ID, and message ID; supply an optional reply ID to fetch a specific reply under that message instead. Use to read the content or metadata of a known channel post. Idempotent read-only lookup.',
		idempotent: true,
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelId: microsoftTeamsProps.channelId({ required: true }),
		messageId: Property.ShortText({
			displayName: 'Message ID',
			required: true,
			description: 'The ID of the channel message to retrieve.',
		}),
		replyId: Property.ShortText({
			displayName: 'Reply ID (optional)',
			required: false,
			description: 'Provide to fetch a specific reply under the message.',
		}),
	},
	async run(context) {
		const { teamId, channelId, messageId, replyId } = context.propsValue;

		const client = microsoftTeamsClient.create({ auth: context.auth });

		const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
		const path = replyId ? `${base}/replies/${replyId}` : base;
		return await microsoftTeamsClient.withRetry(() => client.api(path).get());
	},
});


