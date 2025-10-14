import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findUploadedFile = createAction({
  auth: timelinesAiAuth,
  name: 'findUploadedFile',
  displayName: 'Find Uploaded File',
  description: 'Locate an uploaded file by filename or identifier.',
  props: {
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The name of the uploaded file to search for.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue: { filename } }) {
    const response = await timelinesAiCommon.listUploadedFiles({
      apiKey,
      filename,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Error fetching uploaded files: ${response.message || 'Unknown error'}`
      );
    }
    return response.data;
  },
});
