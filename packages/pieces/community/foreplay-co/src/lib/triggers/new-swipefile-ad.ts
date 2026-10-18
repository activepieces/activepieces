import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { ForeplayAuthInput } from '../common/client';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayPolling } from '../common/polling';
import { foreplayProps } from '../common/props';
import { sampleAd } from './sample-ad';

function fetcher({ auth, propsValue }: { auth: ForeplayAuthInput; propsValue: Record<string, unknown> }) {
  const filters = foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue));
  const pageSize = foreplayPolling.pageSizeOf(propsValue['page_size']);
  return async ({ limit }: { limit: number | undefined }) =>
    foreplayPolling.fetchAdList({ auth, path: '/api/swipefile/ads', query: { ...filters, order: 'saved_newest', limit: limit ?? pageSize, offset: 0 } });
}

const newSwipefileAd = createTrigger({
  auth: foreplayCoAuth,
  name: 'newSwipefileAd',
  displayName: 'New Swipefile Ad',
  description: 'Triggers when a new ad is saved to your swipe file.',
  aiMetadata: {
    description: 'Fires when an ad is newly saved to the Foreplay user\'s swipe file (checked newest saved first), optionally narrowed by ad date range, platform, format, niche, market, language and live status. Each event is one ad. Costs 1 Foreplay credit per ad checked on every poll.',
  },
  classification: 'READ',
  type: TriggerStrategy.POLLING,
  sampleData: sampleAd,
  outputSchema: foreplayOutputSchemas.rawAd,
  props: {
    page_size: foreplayPolling.pageSizeProp(),
    polling_interval: foreplayPolling.legacyPollingIntervalProp(),
    ...foreplayProps.humanAdFilterProps(),
  },
  async onEnable({ auth, propsValue, store }) {
    await foreplayPolling.seed({ store, fetchAds: fetcher({ auth, propsValue }) });
  },
  async onDisable({ store }) {
    await foreplayPolling.clear(store);
  },
  async test({ auth, propsValue }) {
    return foreplayPolling.testAds({ fetchAds: fetcher({ auth, propsValue }) });
  },
  async run({ auth, propsValue, store }) {
    return foreplayPolling.pollNewAds({ store, fetchAds: fetcher({ auth, propsValue }) });
  },
});

export { newSwipefileAd };
