import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListKbDocumentsOutputSchema } from '../../output-schemas';

export const listKbDocuments = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_kb_documents',
  outputSchema: elevenlabsListKbDocumentsOutputSchema,
  displayName: 'List KB Documents',
  description: 'List knowledge base documents',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists knowledge base documents and folders with their ids, names and types. Search by name and page with next_cursor. Use to find a documentation_id.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against the document name', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Only items in this folder', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { documents: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base`,
      queryParams: { search: propsValue.search, page_size: propsValue.pageSize, cursor: propsValue.cursor, parent_folder_id: propsValue.parentFolderId },
    });
    return { ...response, count: response.documents.length };
  },
});
