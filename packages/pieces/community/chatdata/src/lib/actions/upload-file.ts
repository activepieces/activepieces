import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown } from '../common/dropdown';

export const uploadFile = createAction({
  auth: ChatDataAuth,
  name: 'uploadFile',
  displayName: 'Upload File',
  description: 'Uploads a file to the chatbot',
  props: {
    chatbotId: chatbotIdDropdown,
    file: Property.File({
      displayName: "File",
      description: "Select the file to upload",
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const apFile = propsValue.file;

    const fileBuffer = Buffer.from(apFile.data);

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), apFile.filename);

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/upload-file/${propsValue.chatbotId}`,
      {
        body: formData,
        headers: {

        },
      }
    );

    return response;
  },
});