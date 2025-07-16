import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryApiCall } from '../common/client';
import { fireberryAuth } from '../common/auth';

export const createRecordAction = createAction({
  auth: fireberryAuth,
  name: 'create-record',
  displayName: 'Create Record',
  description: 'Create a new record in a specified Fireberry object using its object code.',
  props: {
    objectCode: Property.Number({
      displayName: 'Object Code',
      description: 'Enter the numeric object code (e.g., 1 for Contacts).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Primary name for the record.',
      required: true,
    }),
    ownerid: Property.ShortText({
      displayName: 'Owner ID',
      description: 'GUID of the user creating the record.',
      required: false,
    }),
  },
  async run(context) {
    const { objectCode, name, ownerid } = context.propsValue;

    const body: Record<string, unknown> = {
      name,
    };

    if (ownerid) {
      body['ownerid'] = ownerid;
    }

    try {
      const response = await fireberryApiCall<any>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/record/${objectCode}`,
        body,
      });

      return {
        success: true,
        message: 'Record created successfully!',
        data: response,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;

      if (status === 400) {
        throw new Error(`Bad Request: ${msg}`);
      } else if (status === 401) {
        throw new Error('Unauthorized: Invalid or missing API key.');
      } else if (status === 403) {
        throw new Error('Forbidden: You do not have access to perform this action.');
      } else if (status === 404) {
        throw new Error('Not Found: Invalid object code.');
      } else {
        throw new Error(`Fireberry API Error (${status || 'Unknown'}): ${msg}`);
      }
    }
  },
});
