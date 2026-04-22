import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';

export const draftTagsChangedTrigger = createTrigger({
  auth: typefullyAuth,
  name: 'typefully_draft_tags_changed',
  displayName: 'Draft Tags Changed',
  description: 'Triggers when the tags on a draft are modified in Typefully.',
  props: {
    instructions: instructionsMarkdown('draft.tags_changed'),
  },
  sampleData: smapledata('draft.tags_changed'),
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Typefully webhooks are configured manually in the Typefully dashboard.
  },

  async onDisable(_context) {
    // Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
  },

  async run(context) {
    const payload = context.payload.body as any;
    if (payload.event !== 'draft.tags_changed') {
      return [];
    }
    return [payload];
  },
});
