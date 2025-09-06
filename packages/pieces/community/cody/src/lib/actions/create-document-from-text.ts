import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const createDocumentFromTextAction = createAction({
  auth: codyAuth,
  name: 'createDocumentFromText',
  displayName: 'Create Document From Text',
  description: 'Upload text content to create a new document within the Cody knowledge base.',
  props: {
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name for the new document in the knowledge base. Use a descriptive name to help identify the document later.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Text Content',
      description: 'The text or HTML content to upload to the knowledge base. Maximum size is 768 KB. For larger content, use the "Upload File to Knowledge Base" action instead.',
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional folder ID to organize the document within a specific folder in the knowledge base. Leave empty to place in the root directory.',
      required: false,
    }),
  },
  async run(context) {
    const { name, content, folderId } = context.propsValue;
    
    if (!name || name.trim() === '') {
      throw new Error('Document name is required and cannot be empty');
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Document content is required and cannot be empty');
    }
    
    const contentSizeInBytes = Buffer.byteLength(content, 'utf8');
    const maxSizeInBytes = 768 * 1024;
    if (contentSizeInBytes > maxSizeInBytes) {
      throw new Error(`Content size (${Math.round(contentSizeInBytes / 1024)} KB) exceeds the maximum limit of 768 KB`);
    }
    
    const client = new CodyClient(context.auth);
    
    try {
      const response = await client.createDocumentFromText(name, content, folderId);
      
      if (!response.success) {
        throw new Error(`Failed to create document: ${response.error}`);
      }
      
      const documentData = response.data;
      
      return {
        success: true,
        document: documentData,
        message: `Document "${name}" created successfully in knowledge base${folderId ? ` in folder ${folderId}` : ''}`,
        metadata: {
          documentId: documentData?.id,
          documentName: name,
          folderId: documentData?.folder_id || folderId || null,
          contentSize: `${Math.round(contentSizeInBytes / 1024)} KB`,
          createdAt: documentData?.created_at || Date.now(),
          status: documentData?.status || 'created',
          contentUrl: documentData?.content_url,
          fileType: documentData?.file_type || 'text',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create document from text: ${errorMessage}`);
    }
  },
});
