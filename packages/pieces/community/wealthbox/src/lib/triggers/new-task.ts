import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const newTask = createTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to retrieve',
      required: false,
      defaultValue: 10,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'task_123',
    title: 'Follow up with client',
    description: 'Call client to discuss investment options',
    due_date: '2024-01-15',
    completed: false,
    contact_id: 'contact_456',
    assigned_to: 'user_789',
    priority: 'medium',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  onEnable: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    // Store the current timestamp to only get new tasks
    await context.store.put('lastTaskCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastTaskCheck');
  },
  run: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    const lastCheck = await context.store.get<string>('lastTaskCheck');
    const limit = context.propsValue.limit || 10;

    try {
      const response = await client.getTasks({ limit });
      const tasks = response.data;

      // Filter tasks created after the last check
      const newTasks = tasks.filter(task => {
        if (!lastCheck) return true;
        return new Date(task.created_at!) > new Date(lastCheck);
      });

      // Update the last check timestamp
      if (tasks.length > 0) {
        const latestTask = tasks.reduce((latest, current) => 
          new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest
        );
        await context.store.put('lastTaskCheck', latestTask.created_at);
      }

      return newTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },
}); 