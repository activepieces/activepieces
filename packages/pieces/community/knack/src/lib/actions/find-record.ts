import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall, KnackAuthProps } from '../common/client';
import { knackAuth } from '../common/auth';
import { objectDropdown } from '../common/props';

export const findRecordAction = createAction({
  auth: knackAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description:
    'Search for a single record using field filters (e.g., email, ID).',
  props: {
    object: objectDropdown,
    filters: Property.Json({
      displayName: 'Filter Rules',
      description: 'The Knack filter rules to find the record.',
      required: true,
      defaultValue: {
        match: 'and',
        rules: [
          {
            field: 'field_1',
            operator: 'is',
            value: 'example@email.com',
          },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, filters } = propsValue;

    try {
      const response = await knackApiCall<{ records: unknown[] }>({
        method: HttpMethod.GET,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          filters: JSON.stringify(filters),
          rows_per_page: '1',
        },
      });

      if (response.records && response.records.length > 0) {
        return {
          found: true,
          record: response.records[0],
        };
      }

      return {
        found: false,
        record: null,
        message: 'No record found matching the provided filters.',
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Bad Request: The filter rules are invalid. Please check the JSON format and field/operator values.'
        );
      }

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

      throw new Error(`Failed to find Knack record: ${error.message}`);
    }
  },
});
