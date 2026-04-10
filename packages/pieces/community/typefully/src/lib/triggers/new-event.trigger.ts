import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { draftSampleData, instructionsMarkdown } from '../common/props';

export const newEventTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_new_event',
	displayName: 'New Event',
	description: 'Triggers when a webhook event is received from Typefully.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: instructionsMarkdown,
	},
	sampleData: draftSampleData,
	async onEnable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async onDisable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async run(context) {
		const body = context.payload.body as { event?: string; data?: Record<string, unknown> };
		if (!body.data) return [];
		return [body];
	},
});
