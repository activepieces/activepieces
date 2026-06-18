import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { trustAuth } from '../auth';

export const uploadVideoAction = createAction({
  auth: trustAuth,
  name: 'upload_video',
  displayName: 'Upload Video',
  description: 'Uploads a video to the Trust media library for use in testimonials.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload a video file (MP4, MOV, AVI, etc.) to the Trust media library for use in testimonials. Pick this for standard or longer videos; for brief clips under about 30 seconds, Upload Small Video uses a lighter endpoint, and already-hosted videos can be referenced by URL without uploading. Each call uploads a new copy, so retries create duplicate media (not idempotent).',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Video File',
      description: 'The video file to upload (MP4, MOV, AVI, etc.).',
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
      url: `https://api.usetrust.app/v1/media/upload-video/${props.workspace_id}`,
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
