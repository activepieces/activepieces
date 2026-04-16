import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { azureDevOpsAuth } from '../common';
import {
  azureDevOpsCommon,
  AzureDevOpsHookEvent,
  AzureDevOpsWorkItem,
  FlatWorkItem,
} from '../common';

const TRIGGER_STORE_KEY = 'azure_devops_workitem_subscription_ids';

const sampleWebhookOutput: FlatWorkItem = {
  id: 123,
  rev: 2,
  url: 'https://dev.azure.com/myorg/_apis/wit/workItems/123',
  title: 'Fix login page bug',
  work_item_type: 'Bug',
  state: 'Active',
  reason: 'New',
  assigned_to: 'John Doe',
  assigned_to_email: 'john.doe@example.com',
  created_date: '2024-03-15T10:30:00Z',
  created_by: 'Jane Smith',
  changed_date: '2024-03-15T14:45:00Z',
  changed_by: 'John Doe',
  area_path: 'MyProject\\Backend',
  iteration_path: 'MyProject\\Sprint 5',
  priority: 2,
  description: '<p>Users cannot log in after password reset.</p>',
  project: 'MyProject',
};

export const newUpdatedWorkItemWebhookTrigger = createTrigger({
  auth: azureDevOpsAuth,
  name: 'new_updated_work_item_webhook',
  displayName: 'New or Updated Work Item (Instant)',
  description:
    'Fires instantly when a work item is created, updated, or commented on in Azure DevOps via a Service Hooks subscription. Requires a public webhook URL reachable from Azure DevOps.',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    work_item_type: azureDevOpsCommon.workItemTypeDropdownOptional,
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Which work item lifecycle events should trigger this flow. Select at least one.',
      required: true,
      defaultValue: ['workitem.created', 'workitem.updated'],
      options: {
        options: [
          { label: 'Work Item Created', value: 'workitem.created' },
          { label: 'Work Item Updated', value: 'workitem.updated' },
          { label: 'Work Item Commented', value: 'workitem.commented' },
        ],
      },
    }),
  },
  sampleData: sampleWebhookOutput,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const projectName = context.propsValue.project as string;
    const workItemType = context.propsValue.work_item_type as string | undefined;
    const events = (context.propsValue.events ?? []) as AzureDevOpsHookEvent[];

    const projectId = await azureDevOpsCommon.fetchProjectId(
      context.auth,
      projectName,
    );
    if (!projectId) {
      throw new Error(`Project "${projectName}" not found in Azure DevOps.`);
    }

    const subscriptionIds: string[] = [];
    for (const event of events) {
      const subscription = await azureDevOpsCommon.createSubscription({
        auth: context.auth,
        projectId,
        eventType: event,
        webhookUrl: context.webhookUrl,
        workItemType,
      });
      subscriptionIds.push(subscription.id);
    }

    await context.store.put<string[]>(TRIGGER_STORE_KEY, subscriptionIds);
  },

  async onDisable(context) {
    const subscriptionIds =
      (await context.store.get<string[]>(TRIGGER_STORE_KEY)) ?? [];
    for (const subscriptionId of subscriptionIds) {
      try {
        await azureDevOpsCommon.deleteSubscription({
          auth: context.auth,
          subscriptionId,
        });
      } catch {
        // best-effort cleanup
      }
    }
    await context.store.delete(TRIGGER_STORE_KEY);
  },

  async run(context) {
    const payload = context.payload.body as WebhookPayload;
    if (!payload?.resource) {
      return [];
    }
    if (payload.eventType === 'workitem.commented') {
      return [flattenCommentEvent(payload)];
    }
    return [
      azureDevOpsCommon.flattenWorkItem(payload.resource as AzureDevOpsWorkItem),
    ];
  },

  async test() {
    return [sampleWebhookOutput];
  },
});

function flattenCommentEvent(payload: WebhookPayload): FlatWorkItem & {
  comment: string | null;
} {
  const resource = payload.resource as AzureDevOpsWorkItem & {
    workItemId?: number;
    revision?: { comment?: { content?: string } };
  };
  const flat = azureDevOpsCommon.flattenWorkItem({
    ...resource,
    id: resource.workItemId ?? resource.id,
  });
  return {
    ...flat,
    comment: resource.revision?.comment?.content ?? null,
  };
}

interface WebhookPayload {
  eventType: AzureDevOpsHookEvent;
  resource: unknown;
  resourceContainers?: {
    project?: { id: string };
  };
}
