import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';

export const draftStatusChangedTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_draft_status_changed',
	displayName: 'Draft Status Changed',
	description: 'Triggers on any draft status transition in Typefully (e.g. draft → scheduled → published).',
	props: {
		instructions: instructionsMarkdown('draft.status_changed'),
	},
	sampleData: smapledata('draft.status_changed'),
	type: TriggerStrategy.WEBHOOK,

	async onEnable(_context) {
		// Typefully webhooks are configured manually in the Typefully dashboard.
	},

	async onDisable(_context) {
		// Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
	},

	async run(context) {
		const payload = context.payload.body as any;
		if(payload.event !== 'draft.status_changed') {
			return []
		}
		return [payload];
	},

});
