import {
  createTrigger,
  TriggerStrategy,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { table } from 'console';

const props = {
  databaseId: databaseIdDropdown,
  tableId: tableIdDropdown,
  updatedDateField: Property.ShortText({
    displayName: 'Updated Date Field ID',
    description:
      'The field ID that contains the record update date (e.g., updated_date, updatedAt, last_modified)',
    required: false,
    defaultValue: 'updated_date',
  }),
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { databaseId, tableId, updatedDateField } = propsValue;
    const dateField = updatedDateField || 'updated_date';

    // Build request body for search
    const requestBody: any = {
      paging: {
        offset: 0,
        limit: 100,
      },
    };

    // If we have a lastFetchEpochMS, filter for records updated after that time
    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();
      requestBody.filter = {
        condition: {
          operator: 'GREATER_THAN',
          leftSide: dateField,
          rightSide: lastFetchDate,
        },
      };

      // Sort by update date ascending
      requestBody.sort = {
        field: dateField,
        direction: 'ASC',
      };
    }

    try {
      const response = await makeRequest<any>(
        auth,
        HttpMethod.POST,
        `/databases/${databaseId}/tables/${tableId}/records/search`,
        requestBody
      );

      // Handle different possible response structures
      const records = Array.isArray(response)
        ? response
        : response.records || response.data || [];

      return records.map((record: any) => ({
        epochMilliSeconds: record.fields?.[dateField]
          ? dayjs(record.fields[dateField]).valueOf()
          : dayjs().valueOf(),
        data: record,
      }));
    } catch (error) {
      console.error('Error fetching updated records:', error);
      return [];
    }
  },
};

export const updatedDatabaseRecord = createTrigger({
  auth: SoftrAuth,
  name: 'updatedDatabaseRecord',
  displayName: 'Updated Database Record',
  description: 'Triggers when a record in a Softr database table is modified',
  props,
  sampleData: {
    id: 'rec123456',
    fields: {
      updated_date: '2025-08-01T10:30:00Z',
      field1: 'Updated Value',
      field2: 'Another Updated Value',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
      files,
    });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
      files,
    });
  },
});
