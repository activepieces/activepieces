import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { tenzoAuth } from '../../lib/common/auth';
import { tenzoApiCall } from '../../lib/common/client';
import { tenzoCommon } from '../../lib/common/props';
import { TenzoAuthValue } from '../../lib/common/auth';

interface DailyForecastTriggerProps {
  location_id?: string;
}

interface ForecastSalesByDay {
  id: number;
  location_id: number | null;
  date_of_business: string | null;
  paid_sales_with_tax: number;
  paid_sales_no_tax: number;
  promos_with_tax: number;
  promos_no_tax: number;
  comps_with_tax: number;
  comps_no_tax: number;
  last_modified: string;
  included_service_charge_with_tax: number;
  included_service_charge_no_tax: number;
  created_at: string | null;
}

const polling: Polling<TenzoAuthValue, DailyForecastTriggerProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { location_id } = propsValue;

    if (!location_id) {
      console.error('Location ID is required for polling');
      return [];
    }

    console.debug('Polling for new daily forecasts', { location_id, lastFetchEpochMS });

    try {
      const response = await tenzoApiCall<{
        count: number;
        next: string | null;
        previous: string | null;
        results: ForecastSalesByDay[];
      }>({
        method: HttpMethod.GET,
        path: '/forecast/day/',
        auth,
        query: {
          location_id: location_id.toString(),
          page_size: '100', // Get more results to reduce API calls
        },
      });

      // Filter forecasts created or modified since last fetch
      const cutoffTime = lastFetchEpochMS ? new Date(lastFetchEpochMS) : new Date(0);

      const newForecasts = response.results.filter((forecast: ForecastSalesByDay) => {
        const forecastTime = new Date(forecast.created_at || forecast.last_modified);
        return forecastTime > cutoffTime;
      });

      console.debug(`Found ${newForecasts.length} new forecasts out of ${response.results.length} total`);

      return newForecasts.map((forecast: ForecastSalesByDay) => ({
        epochMilliSeconds: new Date(forecast.created_at || forecast.last_modified).getTime(),
        data: forecast,
      }));
    } catch (error) {
      console.error('Error polling for daily forecasts:', error);
      return [];
    }
  },
};

export const newDailyForecastTrigger = createTrigger({
  auth: tenzoAuth,
  name: 'new_daily_forecast',
  displayName: 'New Daily Forecast',
  description: 'Triggers when there is a new daily forecast for a selected location.',
  props: {
    location_id: tenzoCommon.location_id(true),
  },
  sampleData: {
    id: 12345,
    location_id: 1,
    date_of_business: '2024-01-15',
    paid_sales_with_tax: 1500.50,
    paid_sales_no_tax: 1364.09,
    promos_with_tax: 50.00,
    promos_no_tax: 45.45,
    comps_with_tax: 25.00,
    comps_no_tax: 22.73,
    last_modified: '2024-01-14T10:30:00Z',
    included_service_charge_with_tax: 150.05,
    included_service_charge_no_tax: 136.41,
    created_at: '2024-01-14T10:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { auth, propsValue, store, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
  async onEnable(context) {
    const { auth, propsValue, store } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { auth, propsValue, store } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    const { auth, propsValue, store, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});
