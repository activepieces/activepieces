import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';

const sampleData = {
	id: 'USLACKBOT',
	team_id: 'T06BTHUEFFF',
	name: 'slackbot',
	deleted: false,
	color: '757575',
	real_name: 'Slackbot',
	tz: 'America/Los_Angeles',
	tz_label: 'Pacific Daylight Time',
	tz_offset: -25200,
	profile: {
		title: '',
		phone: '',
		skype: '',
		real_name: 'Slackbot',
		real_name_normalized: 'Slackbot',
		display_name: 'Slackbot',
		display_name_normalized: 'Slackbot',
		fields: {},
		status_text: '',
		status_emoji: '',
		status_emoji_display_info: [],
		status_expiration: 0,
		avatar_hash: 'sv41d8cd98f0',
		always_active: true,
		first_name: 'slackbot',
		last_name: '',
		image_24: 'https://a.slack-edge.com/80588/img/slackbot_24.png',
		image_32: 'https://a.slack-edge.com/80588/img/slackbot_32.png',
		image_48: 'https://a.slack-edge.com/80588/img/slackbot_48.png',
		image_72: 'https://a.slack-edge.com/80588/img/slackbot_72.png',
		image_192: 'https://a.slack-edge.com/80588/marketing/img/avatars/slackbot/avatar-slackbot.png',
		image_512: 'https://a.slack-edge.com/80588/img/slackbot_512.png',
		status_text_canonical: '',
		team: 'T06BTHUEFFF',
	},
	is_admin: false,
	is_owner: false,
	is_primary_owner: false,
	is_restricted: false,
	is_ultra_restricted: false,
	is_bot: false,
	is_app_user: false,
	updated: 0,
	is_email_confirmed: false,
	who_can_share_contact_card: 'EVERYONE',
};

export const newUserTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-user',
	displayName: 'New User',
	description: 'Triggers when a new user is created / first joins your org.',
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData,
	onEnable: async (context) => {
		// Older OAuth2 has team_id, newer has team.id
		const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
		context.app.createListeners({
			events: ['team_join'],
			identifierValue: teamId,
		});
	},
	onDisable: async (context) => {
		// Ignored
	},

	test: async (context) => {
		const client = new WebClient(context.auth.access_token);

		const response = await client.users.list({limit:10});

		if (!response.members) return [sampleData];

		return response.members;
	},

	run: async (context) => {
		const payloadBody = context.payload.body as PayloadBody;

		// check if it's emoji message
		if (payloadBody.event.type !== 'team_join') {
			return [];
		}

		return [payloadBody.event.user];
	},
});

type PayloadBody = {
	event: {
		type: string;
	event_ts:string,
	user:{
		id:string
	}
	};
};
