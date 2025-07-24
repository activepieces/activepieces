import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackAuth } from '../common/auth';
import { knackApiCall } from '../common/client';
import { objectDropdown } from '../common/props';

const LAST_RECORD_IDS_KEY = 'knack_last_record_ids';

export const newFormSubmissionTrigger = createTrigger({
  auth: knackAuth,
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Fires when a form is submitted in a live Knack app.',
  type: TriggerStrategy.POLLING,
  props: {
    object: {
      ...objectDropdown,
      description: 'Select the object where new records will be created.',
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
            sort_field: 'created_at',
            sort_order: 'desc',
            rows_per_page: '100',
        },
      });

      const currentIds = (response.records || []).map((record) => record.id);
      await context.store.put<string[]>(LAST_RECORD_IDS_KEY, currentIds);

    } catch (error: any) {
      throw new Error(`Failed to initialize trigger: ${error.message}`);
    }
  },

  async onDisable(context) {
    await context.store.delete(LAST_RECORD_IDS_KEY);
  },

  async run(context) {
    const { object: objectKey } = context.propsValue;
    const previousIds = (await context.store.get<string[]>(LAST_RECORD_IDS_KEY)) || [];

    try {
      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
            sort_field: 'created_at',
            sort_order: 'desc',
            rows_per_page: '100',
        },
      });

      const allRecords = response.records || [];
      const currentIds = allRecords.map((record) => record.id);

      await context.store.put<string[]>(LAST_RECORD_IDS_KEY, currentIds);

      const newRecords = allRecords.filter((record) => !previousIds.includes(record.id));
      
      return newRecords;

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
      throw new Error(`Failed to check for new records in Knack: ${error.message}`);
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
                sort_field: 'created_at',
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
    id: "678e7c12345b12345c123d12",
    field_1: "Sample Company Name",
    field_1_raw: "Sample Company Name",
    created_at: "2025-07-24T14:10:00.000Z",
    updated_at: "2025-07-24T14:10:00.000Z",
  },
});

interface KnackRecord {
    id: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
