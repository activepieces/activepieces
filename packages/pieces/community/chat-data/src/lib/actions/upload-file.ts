import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';
import { chatbotIdProperty } from '../properties';

export const uploadFile = createAction({
  auth: chatDataAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to be used with a chatbot for training purposes',
  props: {
    chatbotId: chatbotIdProperty,
    file: Property.File({
      displayName: 'File',
      description:
        'The file to upload (supports various formats like PDF, DOC, TXT, etc.)',
      required: true
    })
  },
  async run(context) {
    const { chatbotId, file } = context.propsValue;

    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Create FormData for multipart/form-data upload
    const formData = new FormData();

    // Convert the Buffer to ArrayBuffer for Blob compatibility
    const arrayBuffer = new ArrayBuffer(file.data.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(file.data);

    // Convert the file data to a Blob and append to FormData
    const fileBlob = new Blob([arrayBuffer], { type: file.extension });
    formData.append('file', fileBlob, file.filename);

    // Make the request using httpClient directly for multipart/form-data
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${chatDataCommon.baseUrl}/upload-file/${chatbotId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`
        // Don't set Content-Type header - let the browser set it with boundary
      },
      body: formData
    });

    return response.body;
  }
});
