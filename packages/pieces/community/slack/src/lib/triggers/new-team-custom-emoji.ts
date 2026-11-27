import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, getTeamId, SlackAuthValue } from '../common/auth-helpers';
import { appWebhookSetupInfo } from '../common/props';
import { newTeamCustomEmojiTriggerOutputSchema } from '../output-schemas';

const sampleData = {
	id: 'heart',
	image: 'https://emoji.slack-edge.com/T06BTHUEFFF/heart/84a171ae62daacc7.jpg',
};

export const newTeamCustomEmojiTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-team-custom-emoji',
	classification: 'READ',
	displayName: 'New Team Custom Emoji',
	description: 'Triggers when a custom emoji has been added to a team.',
	aiMetadata: {
		description:
			'Fires when a new custom emoji is added to the Slack workspace (an emoji_changed event with the "add" subtype). The event payload includes the emoji id (name) and the image URL of the added emoji.',
	},
	props: {
		info: appWebhookSetupInfo,
	},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData,
	outputSchema: newTeamCustomEmojiTriggerOutputSchema,
	onEnable: async (context) => {
		const teamId = await getTeamId(context.auth as SlackAuthValue);
		context.app.createListeners({
			events: ['emoji_changed'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	test: async (context) => {
		const client = new WebClient(getBotToken(context.auth as SlackAuthValue));
		const emojiList = (await client.emoji.list()).emoji ?? {};
		const items = Object.entries(emojiList)
			.slice(0, 5)
			.map(([id, value]) => toEmojiItem({ id, value, emojiList }));
		return items.length > 0 ? items : [sampleData];
	},

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		if (payloadBody.event.type !== 'emoji_changed' || payloadBody.event.subtype !== 'add') {
			return [];
		}

		const { name, value } = payloadBody.event;
		if (!value.startsWith(ALIAS_PREFIX)) {
			return [{ id: name, image: value }];
		}
		const client = new WebClient(getBotToken(context.auth as SlackAuthValue));
		const emojiList = (await client.emoji.list()).emoji ?? {};
		return [toEmojiItem({ id: name, value, emojiList })];
	},
});

function toEmojiItem({ id, value, emojiList }: { id: string; value: string; emojiList: Record<string, string> }): EmojiItem {
	if (!value.startsWith(ALIAS_PREFIX)) {
		return { id, image: value };
	}
	const aliasFor = value.slice(ALIAS_PREFIX.length);
	const targetValue = emojiList[aliasFor];
	const image = targetValue && !targetValue.startsWith(ALIAS_PREFIX) ? targetValue : '';
	return { id, image, alias_for: aliasFor };
}

const ALIAS_PREFIX = 'alias:';

type EmojiItem = {
	id: string;
	image: string;
	alias_for?: string;
};

type PayloadBody = {
	event: {
		type: string;
		subtype: string;
		name: string;
		value: string;
	};
};
