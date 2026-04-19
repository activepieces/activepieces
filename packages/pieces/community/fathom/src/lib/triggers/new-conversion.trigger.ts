import { createTrigger, TriggerStrategy, StoreScope, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { fathomAuth } from '../..';

export const newConversion = createTrigger({
  name: 'new_conversion',
  auth: fathomAuth,
  displayName: 'New Conversion',
  description: 'Triggers when a new event/conversion is recorded in Fathom Analytics',
  type: TriggerStrategy.POLLING,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The ID of the Fathom site to watch for conversions',
      required: true,
    }),
  },
  async onEnable({ store }) {
    await store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('lastChecked', StoreScope.FLOW);
  },
  async run({ auth, propsValue, store }) {
    const lastChecked =
      (await store.get<string>('lastChecked', StoreScope.FLOW)) ||
      new Date(0).toISOString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.usefathom.com/v1/events?site_id=${propsValue.site_id}`,
      headers: { Authorization: `Bearer ${auth}` },
    });

    const events: Array<Record<string, unknown>> = response.body?.data || [];
    const newEvents = events.filter(
      (e) => typeof e['created_at'] === 'string' && e['created_at'] > lastChecked
    );

    await store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);
    return newEvents;
  },
  sampleData: {
    id: 'sample-event-id',
    name: 'Example Conversion',
    site_id: 'ABCDEFGH',
    created_at: '2024-01-01T00:00:00Z',
  },
});
