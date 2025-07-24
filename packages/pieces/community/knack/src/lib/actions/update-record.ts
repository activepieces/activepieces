import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall, KnackAuthProps } from '../common/client';
import { knackAuth } from '../common/auth';
import { objectDropdown, recordIdDropdown } from '../common/props';

export const updateRecordAction = createAction({
  auth: knackAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update fields of an existing record.',
  props: {
    object: objectDropdown,
    recordId: recordIdDropdown,
    recordData: Property.Json({
      displayName: 'Data to Update',
      description:
        'The data to update in JSON format. Only the fields you include will be changed (e.g., {"field_1": "New Value"}).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordId, recordData } = propsValue;

    try {
      const response = await knackApiCall({
        method: HttpMethod.PUT,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records/${recordId}`,
        body: recordData,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(
          'Not Found: The record ID was not found in the specified object. Please verify the ID is correct.'
        );
      }

      if (error.message.includes('409')) {
        throw new Error(
          'Conflict: The record could not be updated due to a conflict, such as a duplicate unique value.'
        );
      }

      if (error.message.includes('400')) {
        throw new Error(
          'Bad Request: Invalid request parameters. Please check your Data to Update JSON and field values.'
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

      throw new Error(`Failed to update Knack record: ${error.message}`);
    }
  },
});
