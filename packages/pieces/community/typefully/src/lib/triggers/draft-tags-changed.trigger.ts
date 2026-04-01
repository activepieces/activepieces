import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, sampleData } from '../common/props';

/**
 * @deprecated Use newEventTrigger instead. Kept for backward compatibility with existing flows.
 */
export const draftTagsChangedTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_draft_tags_changed',
	displayName: 'Draft Tags Changed (Deprecated)',
	description:
		'[Deprecated — use "New Event (Webhook)" instead] Triggers when the tags of a draft change in Typefully.',
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
		if (body.event !== 'draft.tags_changed') return [];
		return [body];
	},
});
