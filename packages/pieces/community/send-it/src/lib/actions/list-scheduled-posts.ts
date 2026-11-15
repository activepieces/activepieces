import { createAction } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { platformFilterProperty } from '../common/props';
import { sendItRequests } from '../common/requests';

export const listScheduledPosts = createAction({
  auth: sendItAuth,
  name: 'list_scheduled_posts',
  classification: 'SEARCH',
  displayName: 'List Scheduled Posts',
  description: 'Get a list of pending scheduled posts',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists pending scheduled posts, optionally filtered to one platform; leave the filter empty for all platforms. Each post has its schedule id, platforms, content and scheduledTime. Use it to find the schedule ID to cancel or publish early. count is the number returned in this response. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    platformFilter: platformFilterProperty,
  },
  outputSchema: sendItOutputSchemas.scheduledList,
  async run(context) {
    return sendItRequests.listScheduled({ apiKey: apiKeyOf(context.auth), platform: context.propsValue.platformFilter ?? undefined });
  },
});
