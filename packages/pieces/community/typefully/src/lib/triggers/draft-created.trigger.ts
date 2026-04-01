import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';

export const draftCreatedTrigger = createTrigger({
  auth: typefullyAuth,
  name: 'typefully_draft_created',
  displayName: 'Draft Created',
  description: 'Triggers when a new draft is created in Typefully.',
  props: {
    instructions: instructionsMarkdown('draft.created'),
  },
  sampleData: smapledata('draft.created'),
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Typefully webhooks are configured manually in the Typefully dashboard.
  },

  async onDisable(_context) {
    // Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
  },

  async run(context) {
    const payload = context.payload.body as any;
    if (payload.event !== 'draft.created') {
      return [];
    }
    return [payload];
  },
});
