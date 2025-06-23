import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';

const sampleData = {
	id: 'heart',
	image: 'https://emoji.slack-edge.com/T06BTHUEFFF/heart/84a171ae62daacc7.jpg',
};

export const newTeamCustomEmojiTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-team-custom-emoji',
	displayName: 'New Team Custom Emoji',
	description: 'Triggers when a custom emoji has been added to a team.',
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData,
	onEnable: async (context) => {
		// Older OAuth2 has team_id, newer has team.id
		const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
		context.app.createListeners({
			events: ['emoji_changed'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	test: async (context) => {
		const client = new WebClient(context.auth.access_token);

		const response = await client.emoji.list();

		if (!response.emoji) return [sampleData];

		return Object.entries(response.emoji).map(([id, image]) => ({
			id,
			image,
		}));
	},

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		// check if it's emoji message
		if (payloadBody.event.type !== 'emoji_changed' && payloadBody.event.subtype !== 'add') {
			return [];
		}

		return [{ id: payloadBody.event.name, image: payloadBody.event.value }];
	},
});

type PayloadBody = {
	event: {
		type: string;
		subtype: string;
		name: string;
		value: string;
	};
};
