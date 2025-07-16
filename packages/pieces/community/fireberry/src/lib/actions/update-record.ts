import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryApiCall } from '../common/client';
import { fireberryAuth } from '../common/auth';

export const updateRecordAction = createAction({
  auth: fireberryAuth,
  name: 'update-record',
  displayName: 'Update Record',
  description: 'Update an existing record in a specified Fireberry object using object code and record ID.',
  props: {
    objectCode: Property.Number({
      displayName: 'Object Code',
      description: 'Numeric code of the object (e.g., 1 for Contacts).',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Record ID (GUID)',
      description: 'The GUID of the record you want to update.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Updated name for the record.',
      required: true,
    }),
    ownerid: Property.ShortText({
      displayName: 'Owner ID',
      description: 'GUID of the user to assign as owner of this record.',
      required: false,
    }),
  },
  async run(context) {
    const { objectCode, id, name, ownerid } = context.propsValue;

    const body: Record<string, unknown> = {
      name,
    };

    if (ownerid) {
      body['ownerid'] = ownerid;
    }

    try {
      const response = await fireberryApiCall<any>({
        method: HttpMethod.PUT,
        auth: context.auth,
        resourceUri: `/record/${objectCode}/${id}`,
        body,
      });

      return {
        success: true,
        message: 'Record updated successfully!',
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
        throw new Error('Forbidden: You do not have permission to update this record.');
      } else if (status === 404) {
        throw new Error('Not Found: The specified object or record was not found.');
      } else {
        throw new Error(`Fireberry API Error (${status || 'Unknown'}): ${msg}`);
      }
    }
  },
});
