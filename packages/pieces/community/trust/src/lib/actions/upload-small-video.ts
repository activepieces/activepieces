import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { trustAuth } from '../auth';

export const uploadSmallVideoAction = createAction({
  auth: trustAuth,
  name: 'upload_small_video',
  displayName: 'Upload Small Video',
  description: 'Uploads a short video to the Trust media library.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload a short video clip (best under 30 seconds) to the Trust media library via the dedicated small-video endpoint. Pick this for brief clips; for longer or larger video files use Upload Video instead, and skip uploading entirely if the video is already hosted at a URL. Each call uploads a new copy, so retries create duplicate media (not idempotent).',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Video File',
      description: 'The short video file to upload. Best suited for brief clips under 30 seconds.',
      required: true,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const file = context.propsValue.file;

    const formData = new FormData();
    formData.append('file', Buffer.from(file.base64, 'base64'), file.filename);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.usetrust.app/v1/media/upload-small-video/${props.workspace_id}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: 'apikey',
        password: props.api_key,
      },
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.body;
  },
});
