// https://docs.pdfmonkey.io/references/api/documents#fetches-the-documentcard-data-for-a-given-document

import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findDocument = createAction({
  name: 'find_document',
  displayName: 'Find Document',
  description: 'Get document details from PDFMonkey.',
  auth: pdfmonkeyAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to obtain',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id } = propsValue;
    const path = `/documents/${id}`;

    try {
      const response = await makeRequest({ auth, path, method: HttpMethod.GET });
      return {
        success: true,
        data: response.body.document,
      };
    } catch(e: any) {
      return {
        success: false,
        error: e.response?.body?.errors?.[0]?.detail || e,
      };
    }
  },
});