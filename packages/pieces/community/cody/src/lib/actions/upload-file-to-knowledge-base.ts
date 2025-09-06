import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const uploadFileToKnowledgeBaseAction = createAction({
  auth: codyAuth,
  name: 'uploadFileToKnowledgeBase',
  displayName: 'Upload File to Knowledge Base',
  description: 'Add a file directly into a specific folder in the knowledge base.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload to the knowledge base. Supported formats: txt, md, rtf, pdf, ppt, pptx, pptm, doc, docx, docm. Maximum size: 100 MB.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name for the document in the knowledge base. If not provided, the original filename will be used.',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional folder ID to organize the document within a specific folder in the knowledge base. Leave empty to place in the root directory.',
      required: false,
    }),
  },
  async run(context) {
    const { file, name, folderId } = context.propsValue;
    
    if (!file) {
      throw new Error('File is required for upload');
    }
    
    if (!file.filename || file.filename.trim() === '') {
      throw new Error('File must have a valid filename');
    }
    
    const maxSizeInBytes = 100 * 1024 * 1024;
    if (file.data.length > maxSizeInBytes) {
      throw new Error(`File size (${Math.round(file.data.length / (1024 * 1024))} MB) exceeds the maximum limit of 100 MB`);
    }
    
    const allowedExtensions = ['txt', 'md', 'rtf', 'pdf', 'ppt', 'pptx', 'pptm', 'doc', 'docx', 'docm'];
    const fileExtension = file.filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new Error(`File type "${fileExtension}" is not supported. Allowed types: ${allowedExtensions.join(', ')}`);
    }
    
    const contentTypeMap: Record<string, string> = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'rtf': 'application/rtf',
      'pdf': 'application/pdf',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'docm': 'application/vnd.ms-word.document.macroEnabled.12',
    };
    const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
    
    const client = new CodyClient(context.auth);
    
    try {
      const uploadUrlResponse = await client.getUploadUrl(file.filename, contentType);
      if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.error}`);
      }
      
      const { url, key } = uploadUrlResponse.data;
      
      const uploadResponse = await client.uploadFile(url, Buffer.from(file.data), contentType);
      if (!uploadResponse.success) {
        throw new Error(`Failed to upload file: ${uploadResponse.error}`);
      }
      
      const documentName = name || file.filename;
      const documentResponse = await client.createDocumentFromFile(documentName, key, folderId);
      if (!documentResponse.success) {
        throw new Error(`Failed to create document: ${documentResponse.error}`);
      }
      
      const document = documentResponse.data;
      
      return {
        success: true,
        document: document,
        message: `File "${file.filename}" uploaded successfully to knowledge base${folderId ? ` in folder ${folderId}` : ''}`,
        metadata: {
          documentId: document?.id,
          documentName: documentName,
          originalFileName: file.filename,
          fileSize: `${Math.round(file.data.length / 1024)} KB`,
          fileType: fileExtension,
          contentType: contentType,
          folderId: document?.folder_id || folderId || null,
          status: document?.status || 'processing',
          createdAt: document?.created_at || Date.now(),
          contentUrl: document?.content_url,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to upload file to knowledge base: ${errorMessage}`);
    }
  },
});
