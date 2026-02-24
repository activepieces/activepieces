import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'doc', 'txt', 'jpeg', 'jpg', 'png', 'tiff', 'bmp'];

export const uploadFile = createAction({
  auth: extractaAiAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Uploads document for extraction',
  props: {
    extractionId: Property.ShortText({
      displayName: 'Extraction ID',
      description: 'Unique identifier for the extraction',
      required: true
    }),
    file: Property.File({
      displayName: 'File',
      description: 'Document file to upload (PDF, images, etc.)',
      required: true
    }),
    batchId: Property.ShortText({
      displayName: 'Batch ID',
      description:
        'The ID of the batch to add files to (optional). If not provided, a new batch will be created.',
      required: false
    })
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const { file, extractionId, batchId } = context.propsValue;

    const fileExtension = file.filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      throw new Error(
        `File type not supported. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`
      );
    }
    
    const formData = new FormData();

    formData.append('extractionId', extractionId);

    if (batchId) {
      formData.append('batchId', batchId);
    }

    const blob = new Blob([Buffer.from(file.base64, 'base64')], { 
      type: file.extension ? `application/${file.extension}` : 'application/octet-stream' 
    });
    formData.append('files', blob, file.filename);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/uploadFiles',
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const body = error.response.body;

        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your API key.');
          case 403:
            throw new Error(
              'Access denied. Your API key may not have permission for this operation.'
            );
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 400:
            throw new Error(
              `Invalid request: ${body.message || JSON.stringify(body)}`
            );
          default:
            throw new Error(
              `API error (${status}): ${body.message || 'Unknown error'}`
            );
        }
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }
});
