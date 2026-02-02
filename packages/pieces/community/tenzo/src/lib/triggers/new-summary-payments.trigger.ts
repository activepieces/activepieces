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

interface SummaryPaymentsTriggerProps {
  location_id?: string;
  area_id?: string;
  include_deleted?: boolean;
}

interface SalesByDay {
  id: number;
  location_id: number | null;
  date_of_business: string | null;
  paid_sales_with_tax: number;
  paid_sales_no_tax: number;
  promos_with_tax: number;
  promos_no_tax: number;
  comps_with_tax: number;
  comps_no_tax: number;
  included_service_charge_with_tax: number;
  included_service_charge_no_tax: number;
  last_modified: string;
  number_transactions: number;
  guest_count: number;
  deleted_at: string | null;
}

const polling: Polling<TenzoAuthValue, SummaryPaymentsTriggerProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { location_id, area_id, include_deleted = false } = propsValue;

    console.debug('Polling for new summary payments', { location_id, area_id, include_deleted, lastFetchEpochMS });

    try {
      const queryParams: Record<string, string> = {
        page_size: '100',
        include_deleted: include_deleted.toString(),
      };

      if (location_id) {
        queryParams['location_id'] = location_id;
      }

      if (area_id) {
        queryParams['area_id'] = area_id;
      }

      // Use last_modified parameter if we have a previous fetch time
      if (lastFetchEpochMS) {
        const lastModifiedDate = new Date(lastFetchEpochMS).toISOString();
        queryParams['last_modified'] = lastModifiedDate;
      }

      const response = await tenzoApiCall<{
        count: number;
        next: string | null;
        previous: string | null;
        results: SalesByDay[];
      }>({
        method: HttpMethod.GET,
        path: '/sales/day/',
        auth,
        query: queryParams,
      });

      // Filter for new records based on last_modified timestamp
      const cutoffTime = lastFetchEpochMS ? new Date(lastFetchEpochMS) : new Date(0);

      const newSalesData = response.results.filter((sales: SalesByDay) => {
        const salesTime = new Date(sales.last_modified);
        return salesTime > cutoffTime;
      });

      console.debug(`Found ${newSalesData.length} new sales records out of ${response.results.length} total`);

      return newSalesData.map((sales: SalesByDay) => ({
        epochMilliSeconds: new Date(sales.last_modified).getTime(),
        data: sales,
      }));
    } catch (error) {
      console.error('Error polling for summary payments:', error);
      return [];
    }
  },
};

export const newSummaryPaymentsTrigger = createTrigger({
  auth: tenzoAuth,
  name: 'new_summary_payments',
  displayName: 'New Summary Payments',
  description: 'Triggers when there is new daily sales and payments data.',
  props: {
    location_id: tenzoCommon.location_id(false),
    area_id: tenzoCommon.area_id(false),
    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description: 'Include data that has been deleted',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    id: 12345,
    location_id: 1,
    date_of_business: '2024-01-15',
    paid_sales_with_tax: 2500.75,
    paid_sales_no_tax: 2273.41,
    promos_with_tax: 100.00,
    promos_no_tax: 90.91,
    comps_with_tax: 50.00,
    comps_no_tax: 45.45,
    included_service_charge_with_tax: 250.08,
    included_service_charge_no_tax: 227.34,
    last_modified: '2024-01-15T18:30:00Z',
    number_transactions: 156,
    guest_count: 89,
    deleted_at: null,
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
