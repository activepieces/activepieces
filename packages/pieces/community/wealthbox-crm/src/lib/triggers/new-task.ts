import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const newTaskTrigger = createTrigger({
  auth: wealthboxCrmAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created',
  type: TriggerStrategy.POLLING,
  props: {
    polling_interval: Property.Number({
      displayName: 'Polling Interval (seconds)',
      required: false,
      defaultValue: 60,
      description: 'How often to check for new tasks (minimum 60 seconds)',
    }),
  },
  async onEnable(context) {
    await context.store.put('last_task_id', 0);
  },
  async run(context) {
    const { polling_interval = 60 } = context.propsValue;
    const lastTaskId = await context.store.get('last_task_id') || 0;
    
    const client = makeClient(context.auth);
    const tasks = await client.listTasks();
    
    const newTasks = tasks.tasks.filter((task: any) => task.id > lastTaskId);
    
    if (newTasks.length > 0) {
      const maxTaskId = Math.max(...newTasks.map((task: any) => task.id));
      await context.store.put('last_task_id', maxTaskId);
    }
    
    return newTasks;
  },
  sampleData: {
    id: 1,
    type: 'Task',
    subject: 'Follow up with client',
    description: 'Call client to discuss proposal',
    contact_id: 123,
    user_id: 456,
    due_date: '2024-12-31T23:59:59Z',
    priority: 'high',
    status: 'open',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
});
