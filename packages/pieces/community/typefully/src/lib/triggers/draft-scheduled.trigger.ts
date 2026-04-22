import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';

export const draftScheduledTrigger = createTrigger({
  auth: typefullyAuth,
  name: 'typefully_draft_scheduled',
  displayName: 'Draft Scheduled',
  description:
    'Triggers when a draft is scheduled for publishing in Typefully.',
  props: {
    instructions: instructionsMarkdown('draft.scheduled'),
  },
  sampleData: smapledata('draft.scheduled'),
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Typefully webhooks are configured manually in the Typefully dashboard.
  },

  async onDisable(_context) {
    // Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
  },

  async run(context) {
    const payload = context.payload.body as any;
    if (payload.event !== 'draft.scheduled') {
      return [];
    }
    return [payload];
  },
});
