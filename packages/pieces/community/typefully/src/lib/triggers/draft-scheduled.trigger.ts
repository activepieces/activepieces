import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, sampleData } from '../common/props';

/**
 * @deprecated Use newEventTrigger instead. Kept for backward compatibility with existing flows.
 */
export const draftScheduledTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_draft_scheduled',
	displayName: 'Draft Scheduled (Deprecated)',
	description:
		'[Deprecated — use "New Event (Webhook)" instead] Triggers when a draft is scheduled in Typefully.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: instructionsMarkdown,
	},
	sampleData: sampleData,
	async onEnable() {
		// Webhooks are configured manually in the Typefully dashboard (Settings → API → Webhooks).
	},
	async onDisable() {
		// Webhooks are configured manually in the Typefully dashboard (Settings → API → Webhooks).
	},
	async run(context) {
		const body = context.payload.body as { event?: string };
		if (body.event !== 'draft.scheduled') return [];
		return [body];
	},
});
