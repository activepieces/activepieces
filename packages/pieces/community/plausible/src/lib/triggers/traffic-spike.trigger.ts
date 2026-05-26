import {
  createTrigger,
  TriggerStrategy,
  StoreScope,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const trafficSpike = createTrigger({
  name: 'traffic_spike',
  auth: plausibleAuth,
  displayName: 'Traffic Spike',
  description:
    'Triggers once when current visitors exceed a threshold, then resets when they drop below it',
  type: TriggerStrategy.POLLING,
  props: {
    site_id: siteIdDropdown,
    threshold: Property.Number({
      displayName: 'Visitor Threshold',
      description: 'Trigger when visitors exceed this number',
      required: true,
      defaultValue: 100,
    }),
  },
  async onEnable({ store }) {
    await store.put('wasAboveThreshold', false, StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('wasAboveThreshold', StoreScope.FLOW);
  },
  async run({ auth, propsValue, store }) {
    const visitors = await plausibleApiCall<number>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/stats/realtime/visitors',
      queryParams: { site_id: propsValue.site_id },
    });

    const threshold = propsValue.threshold ?? 100;
    const isAbove = visitors >= threshold;
    const wasAbove = await store.get<boolean>('wasAboveThreshold', StoreScope.FLOW);

    await store.put('wasAboveThreshold', isAbove, StoreScope.FLOW);

    if (isAbove && !wasAbove) {
      return [
        {
          site_id: propsValue.site_id,
          current_visitors: visitors,
          threshold,
          triggered_at: new Date().toISOString(),
        },
      ];
    }
    return [];
  },
  sampleData: {
    site_id: 'example.com',
    current_visitors: 150,
    threshold: 100,
    triggered_at: '2024-01-01T12:00:00Z',
  },
});
