import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { gauzyAuth, gauzyWebhookCommon, GauzyWebhookInformation } from '../common';

const triggerNameInStore = 'gauzy_new_task_trigger';

export const newTask = createTrigger({
  auth: gauzyAuth,
  name: 'new_task',
  displayName: 'Gauzy tasks management',
  description: 'Triggers when a new task is created in Gauzy',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tenantId: gauzyWebhookCommon.tenantId,
    organizationId: gauzyWebhookCommon.organizationId,
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: false,
      description: 'Filter tasks by project ID (optional)',
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
      description: 'Filter tasks by status (e.g., "todo", "in_progress", "done")',
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Details',
      required: false,
      description: 'Include detailed information about the task including members, teams, and tags',
      defaultValue: true,
    }),
  },
  sampleData: {
    id: 'sample-task-id',
    title: 'Implement new feature',
    description: 'Create a new module for user management',
    status: 'todo',
    priority: 'high',
    size: 'medium',
    dueDate: '2024-06-01T00:00:00.000Z',
    estimate: 8,
    projectId: 'sample-project-id',
    creatorId: 'sample-creator-id',
    tenantId: 'sample-tenant-id',
    organizationId: 'sample-organization-id',
    members: [
      {
        id: 'sample-member-id',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    ],
  },
  async onEnable(context) {
    // Create the event filter based on props

    const eventFilter: Record<string, unknown> = {
      organizationId: context.propsValue.organizationId,
      tenantId: context.propsValue.tenantId,
    };
    
    if (context.propsValue.projectId) {
      eventFilter['projectId'] = context.propsValue.projectId;
    }
    
    if (context.propsValue.status) {
      eventFilter['status'] = context.propsValue.status;
    }
    
    const webhookId = await gauzyWebhookCommon.createWebhook(
      context.auth,
      context.webhookUrl,
      context.propsValue.tenantId,
      (context.propsValue.organizationId as string) || '',
      ['task.created'],
      eventFilter
    );
    
    await context.store.put<GauzyWebhookInformation>(triggerNameInStore, {
      webhookId: webhookId,
    });
  },
  
  async onDisable(context) {
    const response = await context.store.get<GauzyWebhookInformation>(triggerNameInStore);
    
    if (response !== null && response !== undefined) {
      await gauzyWebhookCommon.deleteWebhook(context.auth, response.webhookId);
    }
  },
  
    async run(context) {
        return [context.payload.body];
    },
});