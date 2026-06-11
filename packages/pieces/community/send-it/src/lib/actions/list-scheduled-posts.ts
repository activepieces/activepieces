import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { platformFilterProperty, sendItRequest } from '../common';

export const listScheduledPosts = createAction({
  auth: sendItAuth,
  name: 'list_scheduled_posts',
  displayName: 'List Scheduled Posts',
  description: 'Get a list of pending scheduled posts',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists pending scheduled posts, optionally filtered to a single platform; leaving the platform filter empty returns scheduled posts across all platforms. Use this to find the schedule ID of a post you want to cancel or trigger early, or to review the publishing queue. Idempotent: it is a read-only list.',
    idempotent: true,
  },
  props: {
    platformFilter: platformFilterProperty,
  },
  async run(context) {
    const { platformFilter } = context.propsValue;
    const params = platformFilter ? { platform: platformFilter } : undefined;

    return await sendItRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      '/scheduled',
      undefined,
      params
    );
  },
});
