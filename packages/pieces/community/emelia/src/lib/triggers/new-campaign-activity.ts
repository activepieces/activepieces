import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaActivityPolling } from '../common/activity-polling';
import { emeliaProps } from '../common/props';

export const newCampaignActivityTrigger = createTrigger({
	auth: emeliaAuth,
	name: 'new_campaign_activity',
	classification: 'READ',
	displayName: 'New Campaign Activity',
	description: 'Triggers when something happens in a campaign: an email is opened or clicked, a LinkedIn invitation is accepted, an email bounces, and more.',
	aiMetadata: {
		description:
			'Fires once per activity of the selected types (email sent, opened, clicked, bounced, unsubscribed, LinkedIn visit, invitation, acceptance, message, replies and more) in one Emelia campaign. Polls the campaign activity feed, so events arrive a few minutes after they happen. Use New Reply for replies only.',
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to watch.' }),
		events: Property.StaticMultiSelectDropdown({
			displayName: 'Activity Types',
			description: 'Only trigger for these activities. Opens and clicks are only recorded when tracking is enabled on the campaign.',
			required: true,
			defaultValue: ['ACCEPTED', 'MAIL_REPLIED', 'LINKEDIN_REPLIED'],
			options: {
				disabled: false,
				options: [
					{ label: 'Email sent', value: 'SENT' },
					{ label: 'Email opened', value: 'OPENED' },
					{ label: 'Link clicked', value: 'CLICKED' },
					{ label: 'Email reply', value: 'MAIL_REPLIED' },
					{ label: 'Email follow-up reply', value: 'RE_REPLY_EMAIL' },
					{ label: 'Email bounced', value: 'BOUNCED' },
					{ label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
					{ label: 'LinkedIn profile visited', value: 'VISITED' },
					{ label: 'LinkedIn invitation sent', value: 'INVITED' },
					{ label: 'LinkedIn invitation accepted', value: 'ACCEPTED' },
					{ label: 'LinkedIn message sent', value: 'MESSAGE_SENT' },
					{ label: 'LinkedIn InMail sent', value: 'INMAIL_SENT' },
					{ label: 'LinkedIn reply', value: 'LINKEDIN_REPLIED' },
					{ label: 'LinkedIn follow-up reply', value: 'RE_REPLY_LINKEDIN' },
					{ label: 'LinkedIn post liked', value: 'LIKED' },
					{ label: 'LinkedIn profile followed', value: 'FOLLOWED' },
					{ label: 'WhatsApp message sent', value: 'WHATSAPP_MESSAGE_SENT' },
					{ label: 'WhatsApp reply', value: 'WHATSAPP_REPLIED' },
					{ label: 'Manual task completed', value: 'TASK_COMPLETED' },
					{ label: 'Manual task failed', value: 'TASK_FAILED' },
					{ label: 'Contact excluded', value: 'EXCLUDED' },
				],
			},
		}),
	},
	type: TriggerStrategy.POLLING,
	sampleData: emeliaActivityPolling.SAMPLE_ACTIVITY,
	async onEnable(context) {
		await emeliaActivityPolling.onEnable({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
			types: context.propsValue.events,
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
			types: context.propsValue.events,
		});
	},
	async run(context) {
		return await emeliaActivityPolling.poll({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
			types: context.propsValue.events,
			store: context.store,
		});
	},
});
