import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';

export const taskUpdated = createTrigger({
  auth: sellsyAuth,
  name: 'task_updated',
  displayName: 'Task Updated',
  description: 'Fires when a task is updated',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'task_123',
    title: 'Follow up with client',
    description: 'Call the client to discuss proposal',
    dueDate: '2024-01-15T12:00:00Z',
    priority: 'high',
    status: 'completed',
    assignedTo: 'user_123',
    updatedAt: '2024-01-01T12:00:00Z',
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    console.log(`Webhook registered: ${webhookUrl}`);
  },
  onDisable: async (context) => {
    console.log('Webhook unregistered');
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload.event !== 'task.updated') {
      return [];
    }
    
    return [payload];
  },
}); 