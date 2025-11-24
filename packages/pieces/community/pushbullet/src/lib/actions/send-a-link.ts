import { createAction, Property } from '@activepieces/pieces-framework';
import { bushbulletAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendALink = createAction({
  auth: bushbulletAuth,
  name: 'sendALink',
  displayName: 'Send a Link',
  description: 'Send a link notification',
  props: {
    url: Property.ShortText({
      displayName: 'URL to send',
      description: '',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: '',
      required: false,
    }),
    body: Property.ShortText({
      displayName: 'Body',
      description: '',
      required: false,
    }),
  },
  async run(context) {
    const { url, title, body } = context.propsValue;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/pushes',
      {
        type: 'link',
        url,
        title,
        body,
      }
    );

    return response
  },
});
