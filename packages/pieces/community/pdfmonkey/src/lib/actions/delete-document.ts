import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'deleteDocument',
  displayName: 'Delete Document',
  description: '',
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { document_id } = propsValue;
    return await makeRequest(
      auth as string,
      HttpMethod.DELETE,
      `/documents/${document_id}`
    );
  },
});
