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
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbaseAuth, QuickbaseAuth } from '../../lib/common/auth';

const props = {
  tableId: Property.ShortText({
    displayName: 'Table ID',
    description: 'The ID of the Quickbase table to monitor for new records',
    required: true,
  }),
  dateCreatedFieldId: Property.Number({
    displayName: 'Date Created Field ID',
    description:
      'The field ID that stores the record creation date (usually field 1 or 5)',
    required: true,
    defaultValue: 1,
  }),
};

const polling: Polling<QuickbaseAuth, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { tableId, dateCreatedFieldId } = propsValue;
    const isTest = lastFetchEpochMS === 0;

    // Calculate the date to query from
    const fromDate = isTest
      ? dayjs().subtract(1, 'day').valueOf()
      : lastFetchEpochMS;

    // Build Quickbase query
    const queryBody = {
      from: tableId,
      select: [3], // Select all fields
      where: `{${dateCreatedFieldId}.GT.${fromDate}}`,
      sortBy: [
        {
          fieldId: dateCreatedFieldId,
          order: 'ASC',
        },
      ],
      options: {
        skip: 0,
        top: isTest ? 10 : 100, // Limit results for testing
      },
    };

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{
          [key: string]: { value: any };
        }>;
        metadata: {
          totalRecords: number;
        };
      }>({
        method: HttpMethod.POST,
        url: `https://api.quickbase.com/v1/records/query`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: queryBody,
      });

      const records = response.body.data || [];

      return records.map((record) => {
        // Extract the creation date from the record
        const dateCreatedField = record[dateCreatedFieldId.toString()];
        const createdDate = dateCreatedField?.value
          ? dayjs(dateCreatedField.value).valueOf()
          : dayjs().valueOf();

        // Transform record to more readable format
        const transformedRecord: Record<string, any> = {};
        for (const [fieldId, fieldData] of Object.entries(record)) {
          transformedRecord[`field_${fieldId}`] = fieldData.value;
        }

        return {
          epochMilliSeconds: createdDate,
          data: transformedRecord,
        };
      });
    } catch (error: any) {
      console.error('Error fetching Quickbase records:', error);
      throw new Error(
        `Failed to fetch records from Quickbase: ${error.message || 'Unknown error'}`
      );
    }
  },
};

export const newRecord = createTrigger({
  auth: quickbaseAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a Quickbase table',
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
    field_1: 1,
    field_3: 'Sample Record',
    field_6: '2025-10-27T12:00:00.000Z',
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
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
});