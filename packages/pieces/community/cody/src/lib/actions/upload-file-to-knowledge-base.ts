import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Document } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadFileToKnowledgeBaseAction = createAction({
  auth: codyAuth,
  name: 'upload_file_to_knowledge_base',
  displayName: 'Upload File to Knowledge Base',
  description: 'Add a file directly into a specific folder in the knowledge base',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The file to upload to the knowledge base',
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      required: false,
      description: 'Optional folder ID to organize the file',
    }),
    name: Property.ShortText({
      displayName: 'Document Name',
      required: false,
      description: 'Optional custom name for the document (defaults to filename)',
    }),
  },
  async run(context) {
    const { file, folder_id, name } = context.propsValue;

    // Convert file to base64 and prepare for upload
    const documentName = name || file.filename || 'Uploaded Document';
    
    const response = await makeRequest<Document>(
      HttpMethod.POST,
      '/documents/upload',
      context.auth,
      {
        name: documentName,
        file_data: file.base64,
        file_name: file.filename,
        folder_id,
      }
    );

    if (!response.success) {
      throw new Error(`Failed to upload file: ${response.error}`);
    }

    return response.data;
  },
});
