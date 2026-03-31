import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, sampleData } from '../common/props';

export const newEventTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_new_event',
	displayName: 'New Event (Webhook)',
	description:
		'Triggers when a webhook event is received from Typefully (draft created, published, scheduled, deleted, etc.).',
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: instructionsMarkdown,
	},
	sampleData: sampleData,
	async onEnable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async onDisable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async run(context) {
		return [context.payload.body];
	},
});
