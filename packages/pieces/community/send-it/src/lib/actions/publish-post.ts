import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import {
  platformProperty,
  textProperty,
  mediaUrlProperty,
  mediaUrlsProperty,
  mediaTypeProperty,
  sendItRequest,
} from '../common';

export const publishPost = createAction({
  auth: sendItAuth,
  name: 'publish_post',
  displayName: 'Publish Post',
  description: 'Publish content to social media platforms immediately',
  props: {
    platforms: platformProperty,
    text: textProperty,
    mediaUrl: mediaUrlProperty,
    mediaUrls: mediaUrlsProperty,
    mediaType: mediaTypeProperty,
  },
  async run(context) {
    const { platforms, text, mediaUrl, mediaUrls, mediaType } = context.propsValue;

    return await sendItRequest(
      context.auth,
      HttpMethod.POST,
      '/publish',
      {
        platforms,
        content: {
          text,
          mediaUrl,
          mediaUrls,
          mediaType,
        },
      }
    );
  },
});
