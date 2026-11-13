import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateKbFileDocumentOutputSchema } from '../../output-schemas';

export const createKbFolder = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_kb_folder',
  outputSchema: elevenlabsCreateKbFileDocumentOutputSchema,
  displayName: 'Create KB Folder',
  description: 'Create a knowledge base folder',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a folder in the knowledge base and returns its id. Not idempotent: each call creates another folder.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Folder name', required: true }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Folder id to place it in, from List KB Documents', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/folder`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, parent_folder_id: propsValue.parentFolderId } }),
    });
    return response ?? { success: true };
  },
});
