import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentIdDropdown } from '../common/props';

export const deleteDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'deleteDocument',
  displayName: 'Delete Document',
  description: '',
  props: {
    document_id: documentIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { document_id } = propsValue;
    if (!document_id) {
      throw new Error('Document ID is required');
    }
    const response = await makeRequest(
      auth as string,
      HttpMethod.DELETE,
      `/documents/${document_id}`
    );
    return {
      status: 'success',
      message: 'Document deleted successfully',
      data: response,
    };
  },
});
