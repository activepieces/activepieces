import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import {
  KnackGetObjectResponse,
  knackTransformFields,
  objectDropdown,
  recordFields,
} from '../common/props';

export const createRecordAction = createAction({
  auth: knackAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Creates a new record into a specified object/table.',
  props: {
    object: objectDropdown,
    recordFields: recordFields,
  },
  async run({ propsValue, auth }) {
    const { object: objectKey, recordFields: recordData } = propsValue;

    try {
      const response = await knackApiCall<Record<string, any>>({
        method: HttpMethod.POST,
        auth: auth,
        resourceUri: `/objects/${objectKey}/records`,
        body: recordData,
      });

      const objectDetails = await knackApiCall<KnackGetObjectResponse>({
        method: HttpMethod.GET,
        auth,
        resourceUri: `/objects/${objectKey}`,
      });

      const transformedRecord = knackTransformFields(objectDetails, response);

      return transformedRecord;
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
