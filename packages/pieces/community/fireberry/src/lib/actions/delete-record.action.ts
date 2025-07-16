import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateApiResponse } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

export const deleteRecordAction = createAction({
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Permanently delete a specified record (standard or custom object).',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
      description: 'The unique identifier of the record to delete.',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, recordId } = propsValue;
    if (!recordId) throw new Error('Record ID is required');
    let resourceUri = '';
    if (isCustomObject(objectType)) {
      resourceUri = `/custom-object-records/${recordId}/`;
    } else {
      resourceUri = `/${objectType}/${recordId}/`;
    }
    const response = await client.request({
      method: HttpMethod.DELETE,
      resourceUri,
    });
    validateApiResponse(response, ['success']);
    return { success: true };
  },
}); 