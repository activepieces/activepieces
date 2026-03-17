import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gptzeroDetectAiAuth } from '../common/auth';

export const scanFile = createAction({
  auth: gptzeroDetectAiAuth,
  name: 'scanFile',
  displayName: 'Scan File',
  description: 'Scan a file for AI-generated content detection',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to scan for AI-generated content',
      required: true,
    }),
  },
  async run(context) {
    const file = context.propsValue.file;

    const formData = new FormData();
    const fileBuffer = Buffer.from(file.base64, 'base64');
    const mimeType = file.extension
      ? `application/${file.extension}`
      : 'application/octet-stream';
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('files', blob, file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.gptzero.me/v2/predict/files',
      headers: {
        'x-api-key': context.auth.secret_text,
      },
      body: formData,
    });

    return response.body;
  },
});
