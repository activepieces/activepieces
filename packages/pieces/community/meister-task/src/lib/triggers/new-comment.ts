import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: 'comment.created',
  data: {
    id: 98765,
    task_id: 12345,
    user_id: 54321,
    comment: 'This is a new comment on the task.',
    created_at: '2025-10-30T17:30:00Z',
    updated_at: '2025-10-30T17:30:00Z',
    mentions: [
      {
        user_id: 67890,
        username: 'john.doe',
      },
    ],
  },
};

export const newComment = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a task.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions('comment.created'),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'comment.created') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
