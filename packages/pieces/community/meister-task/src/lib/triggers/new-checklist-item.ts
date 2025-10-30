import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'checklist_item.created',
  data: {
    id: 54036010,
    task_id: 114372340,
    project_id: 6023397,
    name: 'New checklist item name',
    sequence: 75000.0,
    completed: false,
    created_at: '2025-10-30T10:00:00Z',
    updated_at: '2025-10-30T10:00:00Z',
  },
};

export const newChecklistItem = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('checklist_item.created'),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'checklist_item.created') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
