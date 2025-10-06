import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

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
    const apiKey = context.auth;
    const formData = new FormData();

    formData.append('extractionId', context.propsValue.extractionId);

    if (context.propsValue.batchId) {
      formData.append('batchId', context.propsValue.batchId);
    }

    // Append the file
    const file = context.propsValue.file;
    formData.append(
      'files',
      new Blob([new Uint8Array(file.data)]),
      file.filename
    );

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
        throw new Error(
          `Failed to upload files: ${error.response.status} - ${JSON.stringify(
            error.response.body
          )}`
        );
      }
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }
});
