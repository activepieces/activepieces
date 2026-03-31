import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, smapledata } from '../common/props';
export const draftDeletedTrigger = createTrigger({
  auth: typefullyAuth,
  name: 'typefully_draft_deleted',
  displayName: 'Draft Deleted',
  description: 'Triggers when a draft is deleted in Typefully.',
  props: {
    instructions: instructionsMarkdown('draft.deleted'),
  },
  sampleData: smapledata('draft.deleted'),
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Typefully webhooks are configured manually in the Typefully dashboard.
  },

  async onDisable(_context) {
    // Nothing to clean up — webhooks are managed manually in the Typefully dashboard.
  },

  async run(context) {
    const payload = context.payload.body as any;
    if (payload.event !== 'draft.deleted') {
      return [];
    }
    return [payload];
  },
});
