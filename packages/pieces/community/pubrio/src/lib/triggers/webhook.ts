import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pubrioAuth } from '../../index';

export const pubrioWebhookTrigger = createTrigger({
	auth: pubrioAuth,
	name: 'pubrio_monitor_event',
	displayName: 'Monitor Event (Webhook)',
	description: 'Triggers when a Pubrio monitor fires. Copy the webhook URL into your Pubrio monitor configuration.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		// User needs to copy the webhook URL from Activepieces and paste it into
		// their Pubrio monitor's destination config at dashboard.pubrio.com
		console.log('Webhook URL:', context.webhookUrl);
	},
	async onDisable() {
		// No cleanup needed — user manages webhook URL in Pubrio dashboard
	},
	async run(context) {
		return [context.payload.body as Record<string, unknown>];
	},
	sampleData: {
		monitor_id: 'mon_example123',
		signal_type: 'jobs',
		company: { name: 'Example Corp', domain: 'example.com' },
		signal: { title: 'Software Engineer', location: 'San Francisco, CA' },
	},
});
