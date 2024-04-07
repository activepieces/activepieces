import FormData from 'form-data';
import { Property, createAction, ApFile } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';

const uploadMedia = async (media: ApFile, baseUrl: string, token: string) => {
  const formData = new FormData();
  formData.append('file', Buffer.from(media.base64, 'base64'), media.filename);

  const postMediaResponse = await httpClient.sendRequest({
    url: `${baseUrl}/api/v2/media`,
    method: HttpMethod.POST,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: {
      'Content-type': 'multipart/form-data',
    },
    body: formData,
  });

  return postMediaResponse.body.id;
};

export const postStatus = createAction({
  auth: mastodonAuth,
  name: 'post_status',
  displayName: 'Post Status',
  description: 'Post a status to Mastodon',
  props: {
    status: Property.LongText({
      displayName: 'Status',
      description: 'The text of your status',
      required: true,
    }),
    media: Property.File({
      displayName: 'Media URL or File',
      description: 'The media attachment for your status',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const status = context.propsValue.status;
    const media = context.propsValue.media;
    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');

    let mediaId: string | undefined = undefined;
    if (media) {
      mediaId = await uploadMedia(media, baseUrl, token);
    }

    return await httpClient.sendRequest({
      url: `${baseUrl}/api/v1/statuses`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        status,
        ...(mediaId ? { media_ids: [mediaId] } : {}),
      },
    });
  },
});
