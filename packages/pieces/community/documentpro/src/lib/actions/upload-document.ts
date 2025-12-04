import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentproAuth } from '../common/auth';

export const uploaddocument = createAction({
  auth: documentproAuth,
  name: 'uploadDocument',
  displayName: 'Upload document',
  description: 'Uploads a document to a DocumentPro parser',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The document file to upload (PDF, JPEG, PNG, or TIFF, max 6MB)',
      required: true,
    }),
  },
  async run(context) {
    const file = context.propsValue.file;

    const formData = new FormData();
    const fileBuffer = Buffer.from(file.base64, 'base64');
    const mimeType = file.extension ? `application/${file.extension}` : 'application/octet-stream';
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.documentpro.ai/v1/documents',
      headers: {
        'x-api-key': context.auth.secret_text,
        'Content-Type': 'multipart/form-data',
      }, 
      body: formData,
    });

    return response.body;
  },
});
