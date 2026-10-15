import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaActivityPolling } from '../common/activity-polling';
import { emeliaProps } from '../common/props';

export const newReplyTrigger = createTrigger({
	auth: emeliaAuth,
	name: 'new_reply',
	classification: 'READ',
	displayName: 'New Reply',
	description: 'Triggers when a contact replies to a campaign by email, LinkedIn or WhatsApp.',
	aiMetadata: {
		description:
			'Fires once per reply (email, LinkedIn or WhatsApp) received in the selected Emelia campaign, with the contact and the reply text. Polls the campaign activity feed, so replies arrive a few minutes after they are received.',
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to watch for replies.' }),
	},
	type: TriggerStrategy.POLLING,
	sampleData: emeliaActivityPolling.SAMPLE_ACTIVITY,
	async onEnable(context) {
		await emeliaActivityPolling.onEnable({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
			types: REPLY_EVENTS,
			store: context.store,
			isRepublish: context.isRepublish,
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		return await emeliaActivityPolling.sample({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
			types: REPLY_EVENTS,
		});
	},
	async run(context) {
		return await emeliaActivityPolling.poll({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
			types: REPLY_EVENTS,
			store: context.store,
		});
	},
});

const REPLY_EVENTS = ['MAIL_REPLIED', 'LINKEDIN_REPLIED', 'WHATSAPP_REPLIED'];
