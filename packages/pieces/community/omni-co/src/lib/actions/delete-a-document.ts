import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentIdDropdown } from '../common/props';

export const deleteADocument = createAction({
  auth: omniAuth,
  name: 'deleteADocument',
  displayName: 'Delete a document',
  description: 'Deletes the specified document and places it in the Trash',
  props: {
    documentId: documentIdDropdown,
  },
  async run(context) {
    const { documentId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/documents/${documentId}`,
      {}
    );

    return response;
  },
});
