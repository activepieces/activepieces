import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateKbFileDocumentOutputSchema } from '../../output-schemas';

export const createKbTextDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_kb_text_document',
  outputSchema: elevenlabsCreateKbFileDocumentOutputSchema,
  displayName: 'Create KB Text Document',
  description: 'Add text to the knowledge base',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Adds a text snippet as a knowledge base document and returns its id. Not idempotent: each call adds another document.',
    idempotent: false,
  },
  props: {
    text: Property.LongText({ displayName: 'Text', description: 'The document text', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Document name', required: false }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder id to place it in, from List KB Documents', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/text`,
      body: elevenlabsClient.compact({ values: { text: propsValue.text, name: propsValue.name, parent_folder_id: propsValue.parentFolderId } }),
    });
    return response ?? { success: true };
  },
});
