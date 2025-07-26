import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackAuth } from '../common/auth';
import { knackApiCall } from '../common/client';
import { objectDropdown } from '../common/props';

const LAST_FETCH_TIMESTAMP_KEY = 'knack_updated_record_timestamp';

export const updatedRecordTrigger = createTrigger({
  auth: knackAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Fires when an existing record is updated.',
  type: TriggerStrategy.POLLING,
  props: {
    object: {
      ...objectDropdown,
      description: 'Select the object to monitor for updated records.',
    },
  },

  async onEnable(context) {
    await context.store.put(LAST_FETCH_TIMESTAMP_KEY, Date.now());
  },

  async onDisable(context) {
    await context.store.delete(LAST_FETCH_TIMESTAMP_KEY);
  },

  async run(context) {
    const { object: objectKey } = context.propsValue;
    const lastFetchTimestamp =
      (await context.store.get<number>(LAST_FETCH_TIMESTAMP_KEY)) || 0;
    const currentTime = Date.now();

    try {
      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          sort_field: 'updated_at',
          sort_order: 'desc',
          rows_per_page: '1000',
        },
      });

      const allRecords = response.records || [];

      const updatedRecords = allRecords.filter(
        (record) => new Date(record.updated_at).getTime() > lastFetchTimestamp
      );

      await context.store.put(LAST_FETCH_TIMESTAMP_KEY, currentTime);

      return updatedRecords;
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication Failed: Please check your API Key, Application ID, and user permissions.'
        );
      }
      if (error.message.includes('429')) {
        throw new Error(
          'Rate Limit Exceeded: Too many requests. Please wait a moment before trying again.'
        );
      }
      throw new Error(
        `Failed to check for updated records in Knack: ${error.message}`
      );
    }
  },

  async test(context) {
    const { object: objectKey } = context.propsValue;

    try {
      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          sort_field: 'updated_at',
          sort_order: 'desc',
          rows_per_page: '1',
        },
      });
      return response.records || [];
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },

  sampleData: {
    id: '678e7c12345b12345c123d12',
    field_1: 'An Updated Record Name',
    field_1_raw: 'An Updated Record Name',
    created_at: '2025-07-24T14:10:00.000Z',
    updated_at: '2025-07-24T18:30:00.000Z',
  },
});

interface KnackRecord {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}
