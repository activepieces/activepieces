import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { scheduledStatusPageOutputSchema } from '../output-schemas';

export const listScheduledStatuses = createAction({
  auth: mastodonAuth,
  name: 'list_scheduled_statuses',
  classification: 'SEARCH',
  displayName: 'List Scheduled Statuses',
  description: 'List your statuses scheduled for future publication.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of the connected account\'s scheduled (not yet published) statuses with cursors for further pages. Use Get Scheduled Status for one item. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: scheduledStatusPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'scheduled statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/scheduled_statuses',
      operation: 'List Scheduled Statuses',
      scope: 'read:statuses',
      query: { limit, max_id, since_id, min_id },
    });
    return { scheduled_statuses: items, ...cursors };
  },
});
