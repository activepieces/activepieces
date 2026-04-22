import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';

export const draftPublishedTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_draft_published',
	displayName: 'Draft Published',
	description: 'Triggers when a draft is successfully published in Typefully.',
	props: {
		instructions: instructionsMarkdown('draft.published'),
	},
	sampleData: smapledata('draft.published'),
	type: TriggerStrategy.WEBHOOK,

	async onEnable(_context) {
		// Typefully webhooks are configured manually in the Typefully dashboard.
	},

	async onDisable(_context) {
		// Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
	},

	async run(context) {
		const payload = context.payload.body as any;
		if(payload.event !== 'draft.published') {
			return []
		}
		return [payload];
	},
});

