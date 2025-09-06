import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Document } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDocumentFromTextAction = createAction({
  auth: codyAuth,
  name: 'create_document_from_text',
  displayName: 'Create Document From Text',
  description: 'Upload text content to create a new document within the Cody knowledge base',
  props: {
    name: Property.ShortText({
      displayName: 'Document Name',
      required: true,
      description: 'Name for the document',
    }),
    content: Property.LongText({
      displayName: 'Text Content',
      required: true,
      description: 'The text content to be uploaded',
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      required: false,
      description: 'Optional folder ID to organize the document',
    }),
  },
  async run(context) {
    const { name, content, folder_id } = context.propsValue;

    const response = await makeRequest<Document>(
      HttpMethod.POST,
      '/documents',
      context.auth,
      {
        name,
        content,
        folder_id,
      }
    );

    if (!response.success) {
      throw new Error(`Failed to create document: ${response.error}`);
    }

    return response.data;
  },
});
