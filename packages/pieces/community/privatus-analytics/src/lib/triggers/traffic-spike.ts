import {
  createTrigger,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { siteDropdown } from '../common/props';
import { getLive } from '../actions/get-live-visitors';

const STORE_KEY = 'privatus_was_above_threshold';

function toEvent(
  siteId: string,
  threshold: number,
  live: Awaited<ReturnType<typeof getLive>>
) {
  return {
    site_id: siteId,
    live_visitors: live.live_visitors,
    threshold,
    top_page: live.top_pages?.[0]?.value ?? null,
    top_referrer: live.top_referrers?.[0]?.value ?? null,
    top_country: live.top_countries?.[0]?.value ?? null,
    top_pages: live.top_pages ?? [],
    top_referrers: live.top_referrers ?? [],
    triggered_at: new Date().toISOString(),
  };
}

export const trafficSpikeTrigger = createTrigger({
  auth: privatusAnalyticsAuth,
  name: 'traffic_spike',
  classification: 'READ',
  displayName: 'Traffic Spike',
  description:
    'Starts once when the number of people on your site right now reaches a number you pick. It starts again only after the number drops below it.',
  aiMetadata: {
    description:
      'Fires once when the live visitor count of a site (visitors in the last 5 minutes) reaches the chosen threshold, with the top page, referrer and country at that moment. It does not fire again until the count falls below the threshold and rises again.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    site_id: siteDropdown,
    threshold: Property.Number({
      displayName: 'Visitors',
      description: 'Start the flow when at least this many people are on the site at once.',
      required: true,
      defaultValue: 50,
    }),
  },
  sampleData: {
    site_id: 'pa_7Q2K9XH3AB',
    live_visitors: 64,
    threshold: 50,
    top_page: '/blog/launch',
    top_referrer: 'news.ycombinator.com',
    top_country: 'US',
    top_pages: [{ value: '/blog/launch', visits: 51 }],
    top_referrers: [{ value: 'news.ycombinator.com', visits: 40 }],
    triggered_at: '2026-10-26T09:15:00.000Z',
  },
  async onEnable(context) {
    await context.store.put(STORE_KEY, false, StoreScope.FLOW);
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY, StoreScope.FLOW);
  },
  async test(context) {
    const live = await getLive(context.auth.secret_text, context.propsValue.site_id, 1);
    return [toEvent(context.propsValue.site_id, context.propsValue.threshold, live)];
  },
  async run(context) {
    const threshold = context.propsValue.threshold;
    const live = await getLive(context.auth.secret_text, context.propsValue.site_id, 1);
    const isAbove = live.live_visitors >= threshold;
    const wasAbove = await context.store.get<boolean>(STORE_KEY, StoreScope.FLOW);
    await context.store.put(STORE_KEY, isAbove, StoreScope.FLOW);
    if (isAbove && !wasAbove) {
      return [toEvent(context.propsValue.site_id, threshold, live)];
    }
    return [];
  },
});
