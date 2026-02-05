import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall, KnackAuthProps } from '../common/client';
import { knackAuth } from '../common/auth';
import { objectDropdown } from '../common/props';

export const deleteRecordAction = createAction({
  auth: knackAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Deletes an existing record from a table.',
  props: {
    object: objectDropdown,
    recordId:  Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The ID of the record to delete.',
    }),
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordId } = propsValue;

    try {
      const response = await knackApiCall({
        method: HttpMethod.DELETE,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records/${recordId}`,
      });
      return response;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(
          'Not Found: The record ID was not found in the specified object. Please verify the ID is correct.'
        );
      }
      
      if (error.message.includes('400')) {
        throw new Error(
          'Bad Request: The request was invalid. Please ensure the Record ID is formatted correctly.'
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

      throw new Error(`Failed to delete Knack record: ${error.message}`);
    }
  },
});
