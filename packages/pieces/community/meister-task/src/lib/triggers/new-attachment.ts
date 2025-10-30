import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'attachment.created',
  data: {
    id: 124578,
    task_id: 789123,
    user_id: 112233,
    name: 'document.pdf',
    size: 30834,
    created_at: '2025-10-30T11:36:25.362Z',
    url: 'https://www.meistertask.com/files/attachments/124578/document.pdf',
  },
};

export const newAttachment = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when a new attachment is created on any task.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('attachment.created'),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'attachment.created') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
