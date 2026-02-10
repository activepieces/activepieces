import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { flowParserAuth } from '../common/auth';

const BASE_URL = 'https://api.flowparser.one/v1';

export const uploadDocument = createAction({
  auth: flowParserAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description: 'Upload a new document to FlowParser for processing',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The document file to upload',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { file } = propsValue;

    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.data)], { type: 'application/octet-stream' });
    formData.append('file', blob, file.filename);

    try {
      const response = await httpClient.sendRequest<{
        success: boolean;
        documentId: string;
        message: string;
      }>({
        method: HttpMethod.POST,
        url: `${BASE_URL}/documents`,
        headers: {
          flow_api_key: auth.secret_text,
        },
        body: formData,
      });

      return response.body;
    } catch (error: any) {
      const statusCode = error.response?.status || error.status;
      const errorBody = error.response?.body || error.body;

      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      if (statusCode >= 400 && statusCode < 500) {
        const errorMessage = errorBody?.message || errorBody?.error || error.message || 'Request failed';
        throw new Error(`Failed to upload document: ${errorMessage}`);
      }

      throw new Error(`FlowParser API error: ${error.message || String(error)}`);
    }
  },
});

