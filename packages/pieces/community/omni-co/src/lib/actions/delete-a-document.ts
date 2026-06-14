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
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes an Omni document by its ID, moving it to the Trash. Use to remove a document the agent has located. Effectively idempotent: once the document is trashed, repeating the call with the same ID has no further effect (subsequent calls may error if the ID no longer resolves).',
    idempotent: true,
  },
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
