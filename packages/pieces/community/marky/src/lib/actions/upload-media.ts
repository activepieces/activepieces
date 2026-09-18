import {
  AuthenticationType,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';

import { markyAuth } from '../auth';
import { MARKY_API_VERSION, MARKY_BASE_URL } from '../common/client';
import { markyProps } from '../common/props';

export const uploadMediaAction = createAction({
  auth: markyAuth,
  name: 'upload_media',
  displayName: 'Upload Media',
  description:
    "Upload an image or video into a business's media library. JPEG, PNG, WebP, GIF, MP4 and MOV are supported, up to 20 MB for images and 500 MB for video.",
  audience: 'both',
  aiMetadata: {
    description:
      'Upload image or video bytes into a Marky business media library and get back the media asset, whose URL can then be attached to a post. Use Create File for markdown documents instead. Each call stores another copy, so retries duplicate.',
    idempotent: false,
  },
  props: {
    businessId: markyProps.businessId,
    file: Property.File({
      displayName: 'File',
      description: 'The image or video to upload.',
      required: true,
    }),
    altText: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Text describing the media for screen readers.',
      required: false,
    }),
  },
  async run(context) {
    const { businessId, file, altText } = context.propsValue;

    const formData = new FormData();
    formData.append('file', file.data, file.filename);

    const queryParams: QueryParams = altText ? { alt_text: altText } : {};

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${MARKY_BASE_URL}/businesses/${businessId}/media`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Marky-Version': MARKY_API_VERSION,
        ...formData.getHeaders(),
      },
      queryParams,
      body: formData,
    });

    return response.body;
  },
});
