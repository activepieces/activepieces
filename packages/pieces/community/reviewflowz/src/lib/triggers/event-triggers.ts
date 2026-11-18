import { createTrigger, InputPropertyMap, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzEvents } from '../common/events';
import { reviewflowzProps } from '../common/props';
import { ReviewflowzEvent } from '../common/types';
import { reviewflowzWebhook, StoredEndpoint } from '../common/webhook';

function filterProps(type: string): InputPropertyMap {
  const all: Record<string, () => InputPropertyMap[string]> = {
    sources: () => reviewflowzProps.sources(),
    locations: () => reviewflowzProps.locations(),
    platforms: () => reviewflowzProps.platforms(),
    campaigns: () => reviewflowzProps.campaigns(),
    tags: () => reviewflowzProps.tags(),
    owners: () => reviewflowzProps.owners(),
    rating_min: () =>
      Property.Number({
        displayName: 'Minimum rating',
        description: 'Only reviews rated this or higher, like 4.',
        required: false,
      }),
    rating_max: () =>
      Property.Number({
        displayName: 'Maximum rating',
        description: 'Only reviews rated this or lower, like 3 for unhappy customers.',
        required: false,
      }),
    channel: () =>
      Property.StaticDropdown({
        displayName: 'Channel',
        description: 'Only unsubscribes from this channel. Leave empty for both.',
        required: false,
        options: {
          options: [
            { label: 'Email', value: 'email' },
            { label: 'Text message', value: 'sms' },
          ],
        },
      }),
  };
  return Object.fromEntries(reviewflowzWebhook.filtersFor(type).map((name) => [name, all[name]()]));
}

function eventTrigger(event: ReviewflowzEvent) {
  return createTrigger({
    auth: reviewflowzAuth,
    name: event.type.replace(/\./g, '_'),
    classification: 'READ',
    displayName: event.label,
    description: event.description,
    aiMetadata: {
      description: `Fires once per Reviewflowz ${event.type} event, instantly through a webhook. ${event.detail} The payload is the object as the Reviewflowz API returns it, with the event's id, type, time and facts under "event".`,
    },
    props: filterProps(event.type),
    type: TriggerStrategy.WEBHOOK,
    sampleData: reviewflowzWebhook.toOutput(event.sample),
    async onEnable(context) {
      const endpoint = await reviewflowzWebhook.subscribe({
        auth: context.auth,
        url: context.webhookUrl,
        events: [event.type],
        label: event.label,
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
      return reviewflowzWebhook.samples({ auth: context.auth, types: [event.type], filters: context.propsValue });
    },
  });
}

export const reviewflowzEventTriggers = reviewflowzEvents.map(eventTrigger);
