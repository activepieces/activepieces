import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall, KnackAuthProps } from '../common/client';
import { knackAuth } from '../common/auth';
import { objectDropdown } from '../common/props';

export const createRecordAction = createAction({
  auth: knackAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Insert a new record into a specified object/table.',
  props: {
    object: objectDropdown,
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'The data for the new record in JSON format. Use field IDs as keys (e.g., {"field_1": "Value A", "field_2": 123}).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordData } = propsValue;

    try {
      const response = await knackApiCall({
        method: HttpMethod.POST,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records`,
        body: recordData,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'Conflict: The record could not be created due to a conflict, such as a duplicate unique value.'
        );
      }
      
      if (error.message.includes('400')) {
        throw new Error(
          'Bad Request: Invalid request parameters. Please check your Record Data JSON and field values.'
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

      throw new Error(`Failed to create Knack record: ${error.message}`);
    }
  },
});
