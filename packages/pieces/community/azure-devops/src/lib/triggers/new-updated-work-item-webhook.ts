import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  azureDevOpsAuth,
  azureDevOpsCommon,
  AzureDevOpsHookEvent,
  FlatWorkItem,
  WebhookPayload,
  WEBHOOK_EVENT_OPTIONS,
  WorkItemResource,
} from '../common';

const TRIGGER_STORE_KEY = 'azure_devops_workitem_subscription_ids';
const TRIGGER_TOKEN_STORE_KEY = 'azure_devops_workitem_webhook_token';
const BASIC_AUTH_USERNAME = 'activepieces';

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
        options: [...WEBHOOK_EVENT_OPTIONS],
      },
    }),
  },
  sampleData: sampleWebhookOutput,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const projectName = azureDevOpsCommon.narrowString(
      context.propsValue.project,
      'project',
    );
    const workItemType =
      typeof context.propsValue.work_item_type === 'string' &&
      context.propsValue.work_item_type.length > 0
        ? context.propsValue.work_item_type
        : undefined;
    const events = filterToHookEvents(context.propsValue.events ?? []);

    const projectId = await azureDevOpsCommon.fetchProjectId(
      context.auth,
      projectName,
    );
    if (!projectId) {
      throw new Error(`Project "${projectName}" not found in Azure DevOps.`);
    }

    const token = azureDevOpsCommon.generateWebhookToken();
    await context.store.put<string>(TRIGGER_TOKEN_STORE_KEY, token);

    const subscriptionIds: string[] = [];
    for (const event of events) {
      const subscription = await azureDevOpsCommon.createSubscription({
        auth: context.auth,
        projectId,
        eventType: event,
        webhookUrl: context.webhookUrl,
        workItemType,
        basicAuthUsername: BASIC_AUTH_USERNAME,
        basicAuthPassword: token,
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
        // best-effort cleanup: if the user already deleted the subscription
        // in Azure DevOps, the DELETE will 404 and we intentionally swallow
      }
    }
    await context.store.delete(TRIGGER_STORE_KEY);
    await context.store.delete(TRIGGER_TOKEN_STORE_KEY);
  },

  async run(context) {
    const expectedToken = await context.store.get<string>(TRIGGER_TOKEN_STORE_KEY);
    if (!expectedToken) return [];

    const authHeader = extractAuthHeader(context.payload.headers);
    if (!authHeader || !verifyBasicAuth(authHeader, BASIC_AUTH_USERNAME, expectedToken)) {
      return [];
    }

    const payload = azureDevOpsCommon.parseWebhookPayload(context.payload.body);
    if (!payload) return [];
    if (payload.eventType === 'workitem.commented') {
      return [flattenCommentEvent(payload)];
    }
    return [flattenResource(payload.resource)];
  },

  async test() {
    return [sampleWebhookOutput];
  },
});

function flattenResource(resource: WorkItemResource): FlatWorkItem {
  return azureDevOpsCommon.flattenWorkItem({
    id: resource.id ?? resource.workItemId ?? 0,
    rev: resource.rev ?? 0,
    url: resource.url,
    fields: resource.fields ?? {},
  });
}

function flattenCommentEvent(payload: WebhookPayload): FlatWorkItem & {
  comment: string | null;
} {
  const { resource } = payload;
  return {
    ...flattenResource(resource),
    comment: resource.revision?.comment?.content ?? null,
  };
}

function extractAuthHeader(headers: Record<string, string | undefined>): string | null {
  const raw = headers['authorization'] ?? headers['Authorization'];
  return typeof raw === 'string' ? raw : null;
}

function verifyBasicAuth(header: string, expectedUser: string, expectedToken: string): boolean {
  const prefix = 'Basic ';
  if (!header.startsWith(prefix)) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(prefix.length), 'base64').toString('utf-8');
  } catch {
    return false;
  }
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  const username = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);
  return (
    azureDevOpsCommon.timingSafeEqual(username, expectedUser) &&
    azureDevOpsCommon.timingSafeEqual(password, expectedToken)
  );
}

function filterToHookEvents(values: readonly unknown[]): AzureDevOpsHookEvent[] {
  const allowed: readonly string[] = WEBHOOK_EVENT_OPTIONS.map((o) => o.value);
  return values.filter(
    (v): v is AzureDevOpsHookEvent => typeof v === 'string' && allowed.includes(v),
  );
}
