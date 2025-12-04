import {
  createAction,
  Property,
  ActionContext,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gladiaAuth } from '../common/auth';
import { BASE_URL } from '../common/client';
import FormData from 'form-data';

export const uploadAFile = createAction({
  auth: gladiaAuth,
  name: 'uploadAFile',
  displayName: 'Upload Audio File',
  description:
    'Upload an audio or video file for use in a pre-recorded transcription job',
  props: {
    audio_file: Property.File({
      displayName: 'Audio File',
      description: 'The audio or video file to upload',
      required: true,
    }),
  },
  async run(context: ActionContext<typeof gladiaAuth>) {
    const apiKey = context.auth.secret_text;
    const audioFile = context.propsValue['audio_file'];

    if (!audioFile) {
      throw new Error('Audio file is required');
    }

    const formData = new FormData();
    formData.append('audio', Buffer.from(audioFile.data), audioFile.filename);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${BASE_URL}/upload`,
        headers: {
          'x-gladia-key': apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      return response.body;
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  },
});
