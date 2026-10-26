import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { ForeplayAuthInput, foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayPolling } from '../common/polling';
import { foreplayProps } from '../common/props';
import { sampleAd } from './sample-ad';

const MAX_DROPDOWN_PAGES = 30;

function fetcher({ auth, propsValue }: { auth: ForeplayAuthInput; propsValue: Record<string, unknown> }) {
  const brandId = foreplayProps.foreplayId({ value: propsValue['brand_id'], label: 'Brand' });
  const filters = foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue));
  const pageSize = foreplayPolling.pageSizeOf(propsValue['page_size']);
  return async ({ limit, cursor }: { limit: number | undefined; cursor: string | undefined }) => {
    const size = limit ?? pageSize;
    return foreplayPolling.fetchAdPage({ auth, path: '/api/spyder/brand/ads', query: { brand_id: brandId, ...filters, order: 'newest', limit: size, cursor }, pageSize: size });
  };
}

const newAdInSpyder = createTrigger({
  auth: foreplayCoAuth,
  name: 'newAdInSpyder',
  displayName: 'New Ad in Spyder',
  description: 'Triggers when Spyder finds a new ad for a tracked brand.',
  aiMetadata: {
    description: 'Fires when a new ad appears among the newest ads Foreplay Spyder has collected for the selected tracked brand, optionally narrowed by platform, format, niche, market, language and live status. Each event is one ad. Costs 1 Foreplay credit per ad checked on every poll.',
  },
  classification: 'READ',
  type: TriggerStrategy.POLLING,
  sampleData: sampleAd,
  outputSchema: foreplayOutputSchemas.rawAd,
  props: {
    brand_id: Property.Dropdown({
      auth: foreplayCoAuth,
      displayName: 'Brand',
      description: 'A brand from your Spyder watchlist.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Foreplay account first.' };
        try {
          const options: { label: string; value: string }[] = [];
          for (let page = 0; page < MAX_DROPDOWN_PAGES; page++) {
            const response = await foreplayClient.request({ auth, path: '/api/spyder/brands', query: { offset: page * 10, limit: 10 } });
            const brands = foreplayMappers.listOf(response.body).map(foreplayMappers.brand);
            for (const b of brands) if (b.id !== null) options.push({ label: b.name ?? b.id, value: b.id });
            if (brands.length < 10) break;
          }
          return { disabled: false, options, placeholder: options.length === 0 ? 'No brands in your Spyder watchlist.' : undefined };
        } catch (error) {
          return { disabled: true, options: [], placeholder: error instanceof Error ? error.message : 'Could not load Spyder brands.' };
        }
      },
    }),
    page_size: foreplayPolling.pageSizeProp(),
    polling_interval: foreplayPolling.legacyPollingIntervalProp(),
    ...foreplayProps.humanAdFilterProps({ withDates: false }),
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
    return foreplayPolling.pollNewAds({ store, fetchAds: fetcher({ auth, propsValue }) });
  },
});

export { newAdInSpyder };
