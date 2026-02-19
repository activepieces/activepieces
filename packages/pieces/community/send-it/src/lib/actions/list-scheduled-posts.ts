import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { platformFilterProperty, sendItRequest } from '../common';

export const listScheduledPosts = createAction({
  auth: sendItAuth,
  name: 'list_scheduled_posts',
  displayName: 'List Scheduled Posts',
  description: 'Get a list of pending scheduled posts',
  props: {
    platformFilter: platformFilterProperty,
  },
  async run(context) {
    const { platformFilter } = context.propsValue;
    const params = platformFilter ? { platform: platformFilter } : undefined;

    return await sendItRequest(
      context.auth,
      HttpMethod.GET,
      '/scheduled',
      undefined,
      params
    );
  },
});
