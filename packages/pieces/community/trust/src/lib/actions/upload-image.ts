import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { trustAuth } from '../auth';

export const uploadImageAction = createAction({
  auth: trustAuth,
  name: 'upload_image',
  displayName: 'Upload Image',
  description: 'Uploads an image to the Trust media library.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload an image file (JPEG, PNG, GIF, etc.) to the Trust media library, typically to use as a profile image for a contact or testimonial. Pick this only when you have raw file data; if the image is already hosted at a URL, pass that URL directly to the contact or testimonial actions instead. Each call uploads a new copy, so retries create duplicate media (not idempotent).',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image File',
      description: 'The image file to upload (JPEG, PNG, GIF, etc.).',
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
      url: `https://api.usetrust.app/v1/media/upload-image/${props.workspace_id}`,
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
