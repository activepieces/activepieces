import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'section.created',
  data: {
    id: '12345',
    name: 'New Section Name',
    project_id: '67890',
    created_at: '2025-10-30T10:00:00Z',
    updated_at: '2025-10-30T10:00:00Z',
  },
};

export const newSection = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('section.created'),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'section.created') return [];
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
