import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateKbFileDocumentOutputSchema } from '../../output-schemas';

export const createKbFileDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_kb_file_document',
  outputSchema: elevenlabsCreateKbFileDocumentOutputSchema,
  displayName: 'Create KB File Document',
  description: 'Add an uploaded file to the knowledge base',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Uploads a file (pdf, txt, docx, html or epub) as a knowledge base document and returns its id. Not idempotent: each call adds another document.',
    idempotent: false,
  },
  props: {
    file: Property.File({ displayName: 'File', description: 'File to add', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Document name', required: false }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder id to place it in, from List KB Documents', required: false }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('file', propsValue.file.data, propsValue.file.filename);
    if (propsValue.name !== undefined) {
      formData.append('name', String(propsValue.name));
    }
    if (propsValue.parentFolderId !== undefined) {
      formData.append('parent_folder_id', String(propsValue.parentFolderId));
    }
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/file`,
      formData,
    });
    return response ?? { success: true };
  },
});
