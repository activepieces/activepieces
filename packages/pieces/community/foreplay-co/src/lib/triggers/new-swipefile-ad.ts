import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { ForeplayAuthInput } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayPolling } from '../common/polling';
import { foreplayProps } from '../common/props';
import { legacyEventMetadata, sampleAd } from './sample-ad';

function fetcher({ auth, propsValue }: { auth: ForeplayAuthInput; propsValue: Record<string, unknown> }) {
  const filters = foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue));
  const pageSize = foreplayPolling.pageSizeOf(propsValue['page_size']);
  return async ({ limit, cursor }: { limit: number | undefined; cursor: string | undefined }) => {
    const size = limit ?? pageSize;
    const offset = cursor === undefined ? 0 : Number(cursor);
    const { ads } = await foreplayPolling.fetchAdPage({ auth, path: '/api/swipefile/ads', query: { ...filters, order: 'saved_newest', limit: size, offset }, pageSize: size });
    return { ads: ads.map((ad) => ({ ...foreplayMappers.recordOf(ad), metadata: legacyEventMetadata })), next: ads.length >= size ? String(offset + ads.length) : null };
  };
}

const newSwipefileAd = createTrigger({
  auth: foreplayCoAuth,
  name: 'newSwipefileAd',
  displayName: 'New Swipefile Ad',
  description: 'Triggers when a new ad is saved to your swipe file.',
  aiMetadata: {
    description: 'Fires when an ad is newly saved to the Foreplay user\'s swipe file (checked newest saved first), optionally narrowed by ad date range, platform, format, niche, market, language and live status. Each event is one ad. Costs 1 Foreplay credit per ad checked on every poll (at most 5 pages per poll). Known limit: Foreplay pages the swipe file only by offset, with no stable cursor or saved-after filter, so if ads are saved or removed while a burst larger than 5 pages is still being worked through, one ad may be missed or repeated.',
  },
  classification: 'READ',
  type: TriggerStrategy.POLLING,
  sampleData: { ...sampleAd, metadata: legacyEventMetadata },
  outputSchema: foreplayOutputSchemas.swipefileAd,
  props: {
    page_size: foreplayPolling.pageSizeProp(),
    polling_interval: foreplayPolling.legacyPollingIntervalProp(),
    ...foreplayProps.humanAdFilterProps(),
  },
  async onEnable({ auth, propsValue, store, isRepublish }) {
    await foreplayPolling.seed({ store, fetchAds: fetcher({ auth, propsValue }), isRepublish });
  },
  async onDisable() {
    return;
  },
  async test({ auth, propsValue }) {
    return foreplayPolling.testAds({ fetchAds: fetcher({ auth, propsValue }) });
  },
  async run({ auth, propsValue, store }) {
    return foreplayPolling.pollNewAds({ store, fetchAds: fetcher({ auth, propsValue }), shifting: true });
  },
});

export { newSwipefileAd };
