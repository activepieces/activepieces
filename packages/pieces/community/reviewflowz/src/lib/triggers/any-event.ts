import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzEvents } from '../common/events';
import { reviewflowzProps } from '../common/props';
import { reviewflowzWebhook, StoredEndpoint } from '../common/webhook';

export const anyEventTrigger = createTrigger({
  auth: reviewflowzAuth,
  name: 'any_event',
  classification: 'READ',
  displayName: 'Any Event',
  description: 'Triggers on any of the events you pick: reviews, replies, sources, ratings and review requests.',
  aiMetadata: {
    description:
      'Fires once per Reviewflowz event of the types picked, instantly through a webhook. Use it when one flow should handle several kinds of events; for a single kind, the dedicated trigger offers more filters.',
  },
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description: 'The events that start this flow.',
      required: true,
      options: {
        options: reviewflowzEvents.map((event) => ({ label: `${event.group}: ${event.label}`, value: event.type })),
      },
    }),
    sources: reviewflowzProps.sources(),
    campaigns: reviewflowzProps.campaigns(),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: reviewflowzWebhook.toOutput(reviewflowzEvents[0].sample),
  async onEnable(context) {
    const endpoint = await reviewflowzWebhook.subscribe({
      auth: context.auth,
      url: context.webhookUrl,
      events: context.propsValue.events,
      label: 'Any Event',
    });
    await context.store.put<StoredEndpoint>(reviewflowzWebhook.ENDPOINT_STORE_KEY, endpoint);
  },
  async onDisable(context) {
    const endpoint = await context.store.get<StoredEndpoint>(reviewflowzWebhook.ENDPOINT_STORE_KEY);
    await reviewflowzWebhook.unsubscribe({ auth: context.auth, endpoint });
    await context.store.delete(reviewflowzWebhook.ENDPOINT_STORE_KEY);
  },
  async run(context) {
    const endpoint = await context.store.get<StoredEndpoint>(reviewflowzWebhook.ENDPOINT_STORE_KEY);
    return reviewflowzWebhook.handle({
      auth: context.auth,
      endpoint,
      headers: context.payload.headers,
      rawBody: context.payload.rawBody,
      body: context.payload.body,
      filters: context.propsValue,
    });
  },
  async test(context) {
    return reviewflowzWebhook.samples({ auth: context.auth, types: context.propsValue.events, filters: context.propsValue });
  },
});
