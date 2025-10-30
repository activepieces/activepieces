import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'label.created',
  data: {
    id: 675849,
    name: 'Urgent',
    color: '#FF5533',
    project_id: 123456,
    created_at: '2025-10-30T11:28:00.362Z',
    updated_at: '2025-10-30T11:28:00.362Z',
  },
};

export const newLabel = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a label is created.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('label.created'),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'label.created') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
