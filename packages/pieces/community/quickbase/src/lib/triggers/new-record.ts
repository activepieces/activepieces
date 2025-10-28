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
  app: Property.Dropdown({
    displayName: 'Application',
    description: 'Select your Quickbase application',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      try {
        // Try to list all apps the user has access to
        const response = await httpClient.sendRequest<Array<{
          id: string;
          name: string;
          created: string;
          updated: string;
        }>>({
          method: HttpMethod.GET,
          url: `https://api.quickbase.com/v1/apps`,
          headers: {
            'QB-Realm-Hostname': (auth as QuickbaseAuth).realm,
            Authorization: `QB-USER-TOKEN ${(auth as QuickbaseAuth).userToken}`,
            'Content-Type': 'application/json',
          },
        });

        const apps = Array.isArray(response.body) ? response.body : [];
        if (apps.length === 0) {
          return {
            disabled: true,
            placeholder: 'No applications found',
            options: [],
          };
        }

        return {
          options: apps.map((app) => ({
            label: app.name,
            value: app.id,
          })),
        };
      } catch (error: any) {
        // If the endpoint doesn't work, provide manual entry instructions
        console.error('Failed to fetch apps:', error);
        return {
          disabled: true,
          placeholder: 'Unable to fetch apps automatically. Please enter App ID manually in the description.',
          options: [],
        };
      }
    },
  }),
  tableId: Property.Dropdown({
    displayName: 'Table',
    description: 'Select the table to monitor for new records',
    required: true,
    refreshers: ['app'],
    options: async ({ auth, app }) => {
      if (!app) {
        return {
          disabled: true,
          placeholder: 'Select an application first',
          options: [],
        };
      }

      try {
        const response = await httpClient.sendRequest<{
          name: string;
          tables: Array<{
            name: string;
            id: string;
          }>;
        }>({
          method: HttpMethod.GET,
          url: `https://api.quickbase.com/v1/apps/${app}`,
          headers: {
            'QB-Realm-Hostname': (auth as QuickbaseAuth).realm,
            Authorization: `QB-USER-TOKEN ${(auth as QuickbaseAuth).userToken}`,
            'Content-Type': 'application/json',
          },
        });

        const tables = response.body.tables || [];
        if (tables.length === 0) {
          return {
            disabled: true,
            placeholder: 'No tables found in this application',
            options: [],
          };
        }

        return {
          options: tables.map((table) => ({
            label: table.name,
            value: table.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch tables. Check your application selection.',
          options: [],
        };
      }
    },
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