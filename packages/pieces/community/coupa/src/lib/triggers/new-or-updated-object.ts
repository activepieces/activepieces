import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  customModuleResourceProperty,
  moduleProperty,
  parseOptionalQuery,
  resolveModuleResource,
  toCoupaModule,
} from '../common/props';
import { formatCoupaOutput } from '../common/utils';

const STANDARD_FIELDS =
  '["id","po-number","number","status","total","supplier","contract","name","updated-at"]';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof coupaAuth>,
  {
    module: string | undefined;
    customResource: string | undefined;
    additionalFilters: unknown;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = new CoupaClient(auth.props);
    const resource = resolveModuleResource(
      propsValue.module,
      propsValue.customResource
    );
    const isTest = lastFetchEpochMS === 0;
    const updatedAfter = isTest
      ? dayjs().subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss')
      : dayjs(lastFetchEpochMS).format('YYYY-MM-DDTHH:mm:ss');

    const query: Record<string, string | number | boolean | undefined> = {
      'updated-at[gt]': updatedAfter,
      limit: isTest ? 10 : 50,
      fields: STANDARD_FIELDS,
      ...parseOptionalQuery(propsValue.additionalFilters),
    };

    const records = await client.request<Record<string, unknown>[]>({
      method: HttpMethod.GET,
      resourceUri: `/${resource}`,
      query,
    });

    const list = Array.isArray(records) ? records : [];
    const coupaModule =
      propsValue.module !== '__custom__' ? toCoupaModule(propsValue.module!) : null;

    return list.map((record) => {
      const updatedAt =
        (record['updated-at'] as string) ??
        (record['updated_at'] as string) ??
        (record['created-at'] as string) ??
        new Date().toISOString();
      const data =
        coupaModule !== null
          ? formatCoupaOutput(record, coupaModule)
          : record;
      return {
        epochMilliSeconds: dayjs(updatedAt).valueOf(),
        data,
      };
    });
  },
};

export const newOrUpdatedObject = createTrigger({
  auth: coupaAuth,
  name: 'new_or_updated_object',
  displayName: 'New or Updated Object',
  description:
    'Triggers when a Purchase Order, Supplier, or Contract is created or updated in Coupa.',
  props: {
    module: moduleProperty,
    customResource: customModuleResourceProperty,
    additionalFilters: Property.Json({
      displayName: 'Additional Filters (JSON)',
      description:
        'Optional Coupa query filters, e.g. `{ "status[in]": "issued,closed" }`.',
      required: false,
    }),
  },
  sampleData: {
    id: 12345,
    supplier_id: 501,
    supplier_name: 'Acme Corp',
    po_number: 'PO-12345',
    po_status: 'issued',
    total_amount: 1500,
    contract_id: 9001,
    updated_at: '2025-06-01T12:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return pollingHelper.poll(polling, ctx);
  },
});
