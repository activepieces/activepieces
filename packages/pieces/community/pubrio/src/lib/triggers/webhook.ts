import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pubrioAuth } from '../../index';

export const pubrioWebhookTrigger = createTrigger({
	auth: pubrioAuth,
	name: 'pubrio_monitor_event',
	displayName: 'Monitor Event (Webhook)',
	description: 'Triggers when a Pubrio monitor fires. Copy the webhook URL into your Pubrio monitor configuration.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable() {
		// No-op: user copies the webhook URL from the Activepieces UI into their Pubrio monitor config.
	},
	async onDisable() {
		// No cleanup needed — user manages webhook URL in Pubrio dashboard
	},
	async run(context) {
		const body = context.payload.body ?? {};
		return [body];
	},
	sampleData: {
		monitor_id: 'mon_example123',
		signal_type: 'jobs',
		company: { name: 'Example Corp', domain: 'example.com' },
		signal: { title: 'Software Engineer', location: 'San Francisco, CA' },
	},
});
