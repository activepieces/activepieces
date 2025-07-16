import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryApiCall } from '../common/client';
import { fireberryAuth } from '../common/auth';

export const getRecordByIdAction = createAction({
  auth: fireberryAuth,
  name: 'get-record-by-id',
  displayName: 'Get Record by ID',
  description: 'Retrieve a specific record from a Fireberry object using its object code and record ID.',
  props: {
    objectCode: Property.Number({
      displayName: 'Object Code',
      description: 'Numeric code of the object (e.g., 1 for Contacts).',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Record ID (GUID)',
      description: 'The GUID of the record you want to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { objectCode, id } = context.propsValue;

    try {
      const response = await fireberryApiCall<any>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/record/${objectCode}/${id}`,
      });

      return {
        success: true,
        message: 'Record retrieved successfully!',
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
        throw new Error('Forbidden: You do not have permission to access this record.');
      } else if (status === 404) {
        throw new Error('Not Found: The specified object or record was not found.');
      } else {
        throw new Error(`Fireberry API Error (${status || 'Unknown'}): ${msg}`);
      }
    }
  },
});
