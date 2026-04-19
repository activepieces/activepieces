import { createTrigger, TriggerStrategy, StoreScope, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';

export const trafficSpike = createTrigger({
  name: 'traffic_spike',
  auth: plausibleAuth,
  displayName: 'Traffic Spike',
  description: 'Triggers when current visitors exceed a threshold',
  type: TriggerStrategy.POLLING,
  props: {
    site_id: Property.ShortText({ displayName: 'Site Domain', required: true }),
    threshold: Property.Number({
      displayName: 'Visitor Threshold',
      description: 'Trigger when visitors exceed this number',
      required: true,
      defaultValue: 100,
    }),
  },
  async onEnable({ store }) {
    await store.put('lastTriggered', 0, StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('lastTriggered', StoreScope.FLOW);
  },
  async run({ auth, propsValue, store }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://plausible.io/api/v1/stats/realtime/visitors?site_id=${encodeURIComponent(propsValue.site_id)}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    const visitors = response.body as number;
    const threshold = propsValue.threshold || 100;
    if (visitors >= threshold) {
      return [{ site_id: propsValue.site_id, current_visitors: visitors, threshold, triggered_at: new Date().toISOString() }];
    }
    return [];
  },
  sampleData: { site_id: 'example.com', current_visitors: 150, threshold: 100, triggered_at: '2024-01-01T12:00:00Z' },
});
