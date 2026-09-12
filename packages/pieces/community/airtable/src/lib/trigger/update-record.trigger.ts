import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  DropdownState,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import Airtable from 'airtable';
import dayjs from 'dayjs';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableField, AirtableTable } from '../common/models';
import { updatedRecordTriggerOutputSchema } from '../output-schemas';

const props = {
  base: airtableCommon.base,
  tableId: airtableCommon.tableId,
  sortFields: Property.Dropdown<string, true, typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'Trigger Field',
    description:
      'A Last Modified Time field of the table. Add one if none exists.',
    required: true,
    refreshers: ['base', 'tableId'],
    options: async ({ auth, base, tableId }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a base first',
        };
      }
      if (!tableId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a table first',
        };
      }

      try {
        const airtable: AirtableTable = await airtableCommon.fetchTable({
          token: auth.secret_text,
          baseId: base as string,
          tableId: tableId as string,
        });

        const options = airtable.fields
          .filter((field: AirtableField) => field.type === 'lastModifiedTime')
          .map((field: AirtableField) => ({
            label: field.name,
            value: field.name,
          }));

        if (options.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This table has no Last Modified Time field',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),
  viewId: airtableCommon.views,
};
const polling: Polling<AppConnectionValueForAuthProperty<typeof airtableAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    Airtable.configure({
      apiKey: auth.secret_text,
    });
    const airtable = new Airtable();

    const lastUpdateDate =
      lastFetchEpochMS === 0
        ? dayjs().subtract(1, 'day').toISOString()
        : dayjs(lastFetchEpochMS).toISOString();

    const records = await airtable
      .base(propsValue.base)
      .table(propsValue.tableId!)
      .select({
        filterByFormula: `IS_AFTER({${
          propsValue.sortFields as string
        }},DATETIME_PARSE("${lastUpdateDate}","YYYY-MM-DD HH:mm:ss.SSS"))`,
        view: propsValue.viewId ?? '',
      })
      .all();

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
  classification: 'READ',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a record is created or changed in the selected table.',
  outputSchema: updatedRecordTriggerOutputSchema,
  aiMetadata: {
    description:
      'Fires when a record is created or modified in the selected base and table (optionally scoped to a view), detected via a chosen Last Modified Time field. Represents a row that was newly added or changed since the last poll; the table must have a last-modified timestamp field for this to work.',
  },
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
