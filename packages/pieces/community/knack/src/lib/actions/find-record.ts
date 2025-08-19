import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  fieldIdDropdown,
  KnackGetObjectResponse,
  knackTransformFields,
  objectDropdown,
} from '../common/props';

export const findRecordAction = createAction({
  auth: knackAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Finds a single record using field value.',
  props: {
    object: objectDropdown,
    fieldId: fieldIdDropdown,
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      required: true,
      description: 'The value to search for in the specified field.',
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, fieldId, fieldValue } = propsValue;

    try {
      const response = await knackApiCall<{ records: Record<string, any>[] }>({
        method: HttpMethod.GET,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          filters: JSON.stringify([
            {
              field: fieldId,
              operator: 'is',
              value: fieldValue,
            },
          ]),
          rows_per_page: '1',
        },
      });

      if (response.records && response.records.length > 0) {
        const objectDetails = await knackApiCall<KnackGetObjectResponse>({
          method: HttpMethod.GET,
          auth,
          resourceUri: `/objects/${objectKey}`,
        });

        const transformedRecord = knackTransformFields(
          objectDetails,
          response.records[0]
        );
        return {
          found: true,
          record: transformedRecord,
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
