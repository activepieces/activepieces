import { createAction, Property } from '@activepieces/pieces-framework';
import { documergeAuth } from '../common/auth';
import { DocuMergeClient } from '../common/client';

export const createDocumentMerge = createAction({
  auth: documergeAuth,
  name: 'create_document_merge',
  displayName: 'Create Document Merge',
  description: 'Send data to your Merge URL',
  audience: 'both',
  aiMetadata: { description: 'Submit field data to a configured DocuMerge document, identified by its document key, to merge that data into the template and generate the populated document. Use to fill a single predefined template. Requires the document key; each submission starts a new merge run (not idempotent).', idempotent: false },
  props: {
    documentKey: Property.ShortText({
      displayName: 'Document Key',
      description: 'The key of the document to merge',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Field data to merge into the document',
      required: false,
    }),
  },
  async run(context) {
    const { documentKey, fields } = context.propsValue;

    if (!documentKey) {
      throw new Error('Document key is required');
    }

    const client = new DocuMergeClient(context.auth.secret_text);

    const response = await client.post<{ message: string }>(
      `/api/documents/merge/${encodeURIComponent(documentKey)}`,
      fields || {}
    );

    return response;
  },
});

