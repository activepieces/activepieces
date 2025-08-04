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

const props = {
  databaseId: Property.ShortText({
    displayName: 'Database ID',
    description: 'The ID of the database to monitor',
    required: true,
  }),
  tableId: Property.ShortText({
    displayName: 'Table ID',
    description: 'The ID of the table to monitor for new records',
    required: true,
  }),
  createdDateField: Property.ShortText({
    displayName: 'Created Date Field ID',
    description:
      'The field ID that contains the record creation date (e.g., created_date, createdAt)',
    required: false,
    defaultValue: 'created_date',
  }),
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { databaseId, tableId, createdDateField } = propsValue;
    const dateField = createdDateField || 'created_date';

    // Build request body for search
    const requestBody: any = {
      paging: {
        offset: 0,
        limit: 100,
      },
    };

    // If we have a lastFetchEpochMS, filter for records created after that time
    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();
      requestBody.filter = {
        condition: {
          operator: 'GREATER_THAN',
          leftSide: dateField,
          rightSide: lastFetchDate,
        },
      };

      // Sort by creation date ascending
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
      console.error('Error fetching records:', error);
      return [];
    }
  },
};

export const newDatabaseRecord = createTrigger({
  auth: SoftrAuth,
  name: 'newDatabaseRecord',
  displayName: 'New Database Record',
  description: 'Triggers when a new record is added to a Softr database table',
  props,
  sampleData: {
    id: 'rec123456',
    fields: {
      created_date: '2025-08-01T10:00:00Z',
      field1: 'Sample Value',
      field2: 'Another Value',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
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
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});
