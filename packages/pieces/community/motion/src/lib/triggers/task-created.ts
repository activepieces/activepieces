import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';

export const taskCreated = createTrigger({
  auth: motionAuth,
  name: 'task-created',
  displayName: 'Task Created',
  description: 'Triggers when a new task is created in Motion',
  type: TriggerStrategy.POLLING,
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The workspace ID to monitor for new tasks',
      required: true,
    }),
  },
  sampleData: {
    id: 'task_123',
    name: 'Sample Task',
    description: 'This is a sample task',
    duration: 60,
    dueDate: '2024-03-20T15:00:00Z',
    deadlineType: 'HARD',
    completed: false,
    creator: {
      id: 'user_123',
      name: 'John Doe',
      email: 'john@example.com',
    },
    workspace: {
      id: 'workspace_123',
      name: 'My Workspace',
    },
    status: {
      name: 'In Progress',
      isDefaultStatus: false,
      isResolvedStatus: false,
    },
    priority: 'HIGH',
    labels: [
      { name: 'Important' },
      { name: 'Urgent' },
    ],
    assignees: [
      {
        id: 'user_456',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    createdTime: '2024-03-19T10:00:00Z',
    updatedTime: '2024-03-19T10:00:00Z',
  },
  async onEnable({ auth, propsValue, store }) {
    // Store the current timestamp to only get tasks created after this point
    await store.put('lastCreatedTime', new Date().toISOString());
  },
  async onDisable({ store }) {
    // Clean up stored data
    await store.delete('lastCreatedTime');
  },
  async run({ auth, propsValue, store }) {
    const lastCreatedTime = await store.get('lastCreatedTime') as string;
    const currentTime = new Date().toISOString();

    // Get tasks from the workspace
    const response = await fetch(`https://api.usemotion.com/v1/tasks?workspaceId=${propsValue.workspaceId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': auth,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get tasks: ${error.message || response.statusText}`);
    }

    const tasks = await response.json();
    
    // Filter tasks created after the last check
    const newTasks = tasks.filter((task: any) => {
      const taskCreatedTime = new Date(task.createdTime).toISOString();
      return taskCreatedTime > lastCreatedTime;
    });

    // Update the last created time
    await store.put('lastCreatedTime', currentTime);

    return newTasks;
  },
}); 