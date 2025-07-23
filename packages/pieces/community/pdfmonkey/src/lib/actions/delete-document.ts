// https://docs.pdfmonkey.io/references/api/documents#deletes-a-document

import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDocument = createAction({
  name: 'delete_document',
  displayName: 'Delete Document',
  description: 'Permanently delete document stored on PDFMonkey',
  auth: pdfmonkeyAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id } = propsValue;
    const path = `/documents/${id}`;

    try {
      const response = await makeRequest({ auth, path, method: HttpMethod.DELETE });
      return {
        success: true,
      };
    } catch(e: any) {
      return {
        success: false,
        error: e.response?.body?.errors?.[0]?.detail || e,
      };
    }
  },
});