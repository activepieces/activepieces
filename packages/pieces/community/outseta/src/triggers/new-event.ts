import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newEventTrigger = createTrigger({
  name: 'new_event',
  auth: outsetaAuth,
  displayName: 'New Event',
  description:
    'Triggers when any event occurs in Outseta. Configure the webhook URL in Outseta under Settings → Notifications.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    EventType: 'account.created',
    Data: {
      Uid: 'abc123',
      Name: 'Example',
    },
  },
  async onEnable() {
    // Webhook must be configured manually in Outseta (Settings → Notifications)
  },
  async onDisable() {
    // Webhook must be removed manually in Outseta
  },
  async run(context) {
    return [context.payload.body as Record<string, unknown>];
  },
  async test(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const res = await client.get<any>(
      '/api/v1/activities?$top=5&$orderby=ActivityDateTime desc'
    );
    const items: Record<string, unknown>[] =
      res?.items ?? res?.Items ?? [];
    return items;
  },
});
