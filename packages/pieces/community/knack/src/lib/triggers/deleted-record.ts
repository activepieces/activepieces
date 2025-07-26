import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackAuth } from '../common/auth';
import { knackApiCall } from '../common/client';
import { objectDropdown } from '../common/props';

const ALL_RECORD_IDS_KEY = 'knack_all_record_ids';

export const deletedRecordTrigger = createTrigger({
  auth: knackAuth,
  name: 'deleted_record',
  displayName: 'Deleted Record (Not Recommended)',
  description:
    'Fires when a record is deleted. WARNING: This trigger is inefficient and not recommended for objects with many records.',
  type: TriggerStrategy.POLLING,
  props: {
    object: {
      ...objectDropdown,
      description: 'Select the object to monitor for deleted records.',
    },
  },

  async onEnable(context) {
    const { object: objectKey } = context.propsValue;

    try {
      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          rows_per_page: '1000',
          fields: 'id',
        },
      });

      const allIds = (response.records || []).map((record) => record.id);
      await context.store.put<string[]>(ALL_RECORD_IDS_KEY, allIds);
    } catch (error: any) {
      throw new Error(`Failed to initialize trigger: ${error.message}`);
    }
  },

  async onDisable(context) {
    await context.store.delete(ALL_RECORD_IDS_KEY);
  },

  async run(context) {
    const { object: objectKey } = context.propsValue;
    const previousIds =
      (await context.store.get<string[]>(ALL_RECORD_IDS_KEY)) || [];

    try {
      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          rows_per_page: '1000',
          fields: 'id',
        },
      });

      const currentIds = (response.records || []).map((record) => record.id);
      await context.store.put<string[]>(ALL_RECORD_IDS_KEY, currentIds);

      const deletedRecordIds = previousIds.filter(
        (id) => !currentIds.includes(id)
      );

      return deletedRecordIds.map((id) => ({
        id: id,
        deletedAt: new Date().toISOString(),
        message: 'This record was detected as deleted.',
      }));
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
        `Failed to check for deleted records in Knack: ${error.message}`
      );
    }
  },

  async test(context) {
    return [this.sampleData];
  },

  sampleData: {
    id: '678e7c12345b12345c123d12',
    deletedAt: '2025-07-24T18:30:00.000Z',
    message: 'This record was detected as deleted.',
  },
});

interface KnackRecord {
  id: string;
  [key: string]: any;
}
