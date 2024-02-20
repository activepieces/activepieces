import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import Airtable from 'airtable';
import dayjs from 'dayjs';
import { airtableAuth } from '../../';
import { airtableCommon } from '../common';
import { AirtableField, AirtableTable } from '../common/models';

const props = {
  base: airtableCommon.base,
  tableId: airtableCommon.tableId,
  sortFields: Property.Dropdown({
    displayName: 'Trigger field',
    description: `**Last Modified Time** field will be used to watch new or updated records.Please create **Last Modified Time** field in your schema,if you don't have any timestamp field.`,
    required: true,
    refreshers: ['base', 'tableId'],
    options: async ({ auth, base, tableId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a base first',
        };
      }
      if (!tableId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a table first',
        };
      }
      const airtable: AirtableTable = await airtableCommon.fetchTable({
        token: auth as unknown as string,
        baseId: base as unknown as string,
        tableId: tableId as unknown as string,
      });

      return {
        disabled: false,
        options: airtable.fields
          .filter((field: AirtableField) => field.type == 'lastModifiedTime')
          .map((field: AirtableField) => ({
            label: field.name,
            value: field.name,
          })),
      };
    },
  }),
  viewId: airtableCommon.views,
};
const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    Airtable.configure({
      apiKey: auth,
    });
    const airtable = new Airtable();
    const currentValues = await airtable
      .base(propsValue.base)
      .table(propsValue.tableId!)
      .select({
        sort: [{ direction: 'desc', field: propsValue.sortFields! }],
        view: propsValue.viewId ?? '',
      })
      .all();
    const records = currentValues.filter((record) => {
      const modified_at = dayjs(record.fields[propsValue.sortFields] as string);
      return modified_at.isAfter(
        lastFetchEpochMS === 0
          ? dayjs().subtract(1, 'day').toISOString()
          : dayjs(lastFetchEpochMS).toISOString()
      );
    });
    return records.map((item) => {
      return {
        epochMilliSeconds: dayjs(
          item.fields[propsValue.sortFields] as string
        ).valueOf(),
        data: item._rawJson,
      };
    });
  },
};

export const airtableUpdatedRecordTrigger = createTrigger({
  auth: airtableAuth,
  name: 'updated_record',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a record is created or updated in selected table.',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
  },
});
