import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateKbFileDocumentOutputSchema } from '../../output-schemas';

export const createKbUrlDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_kb_url_document',
  outputSchema: elevenlabsCreateKbFileDocumentOutputSchema,
  displayName: 'Create KB URL Document',
  description: 'Add a web page to the knowledge base',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Scrapes a web page and adds it as a knowledge base document, returning its id. Not idempotent: each call adds another document.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({ displayName: 'Url', description: 'Page URL', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Document name', required: false }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder id to place it in, from List KB Documents', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/url`,
      body: elevenlabsClient.compact({ values: { url: propsValue.url, name: propsValue.name, parent_folder_id: propsValue.parentFolderId } }),
    });
    return response ?? { success: true };
  },
});
