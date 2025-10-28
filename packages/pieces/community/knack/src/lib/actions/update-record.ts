import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  KnackGetObjectResponse,
  knackTransformFields,
  objectDropdown,
  recordFields,
} from '../common/props';

export const updateRecordAction = createAction({
  auth: knackAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
  props: {
    object: objectDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The ID of the record to update.',
    }),
    recordFields: recordFields,
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordId, recordFields } = propsValue;

    try {
      const response = await knackApiCall<Record<string, any>>({
        method: HttpMethod.PUT,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records/${recordId}`,
        body: recordFields,
      });
      const objectDetails = await knackApiCall<KnackGetObjectResponse>({
        method: HttpMethod.GET,
        auth,
        resourceUri: `/objects/${objectKey}`,
      });

      const transformedRecord = knackTransformFields(objectDetails, response);

      return transformedRecord;
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
