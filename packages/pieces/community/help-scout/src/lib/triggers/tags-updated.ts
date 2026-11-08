import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi, StoredWebhook } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';
import { helpScoutOutputSchemas, helpScoutSampleConversation } from '../common/output-schemas';

export const tagsUpdated = createTrigger({
  auth: helpScoutAuth,
  name: 'tags_updated',
  classification: 'READ',
  displayName: 'Tags Updated',
  description: 'Triggers when tags on a conversation are modified.',
  aiMetadata: {
    description:
      "Fires when a conversation's tags are changed in the selected Help Scout mailbox (convo.tags webhook event), representing a tagging/categorization update. Can optionally be narrowed to conversations assigned to a specific user.",
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    mailboxId: mailboxIdDropdown(true),
    assignedTo: userIdDropdown('Assigned User'),
  },
  outputSchema: helpScoutOutputSchemas['conversationWebhook'],
  sampleData: helpScoutSampleConversation,
  async onEnable(context) {
    const stored = await helpScoutApi.createWebhook({
      auth: context.auth,
      url: context.webhookUrl,
      events: ['convo.tags'],
      mailboxId: context.propsValue.mailboxId,
    });
    await context.store.put<StoredWebhook>(WEBHOOK_KEY, stored);
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>(WEBHOOK_KEY);
    if (stored?.webhookId) {
      await helpScoutApi.deleteWebhook({ auth: context.auth, webhookId: stored.webhookId });
    }
    await context.store.delete(WEBHOOK_KEY);
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>(WEBHOOK_KEY);
    const body = helpScoutApi.verifiedWebhookBody({
      stored,
      headers: context.payload.headers,
      rawBody: context.payload.rawBody,
      body: context.payload.body,
    });
    if (!body) {
      return [];
    }
    if (!helpScoutApi.matchesAssignee({ body, assignedTo: context.propsValue.assignedTo })) {
      return [];
    }
    return [body];
  },
  async test(context) {
    const queryParams: Record<string, string> = { embed: 'threads', status: 'all', sortField: 'modifiedAt', sortOrder: 'desc' };
    if (context.propsValue.mailboxId) queryParams['mailbox'] = String(context.propsValue.mailboxId);
    if (context.propsValue.assignedTo) queryParams['assigned_to'] = String(context.propsValue.assignedTo);
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/conversations',
      auth: context.auth,
      queryParams,
    });
    return helpScoutApi
      .getEmbeddedList({ body: response.body, key: 'conversations' })
      .slice(0, 5);
  },
});

const WEBHOOK_KEY = 'helpscout_tags_updated';
