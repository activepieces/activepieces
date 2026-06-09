import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { trustAuth } from '../auth';

export const uploadImageAction = createAction({
  auth: trustAuth,
  name: 'upload_image',
  displayName: 'Upload Image',
  description: 'Uploads an image to the Trust media library.',
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
