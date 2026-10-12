import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const getListTimeline = createAction({
  auth: mastodonAuth,
  name: 'get_list_timeline',
  classification: 'SEARCH',
  displayName: 'Get List Timeline',
  description: 'Get statuses from the members of one of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of statuses from the members of one of the connected account\'s lists, newest first, with cursors for further pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/timelines/list/${encodeURIComponent(context.propsValue.list_id)}`,
      operation: 'Get List Timeline',
      scope: 'read:lists',
      query: { limit, max_id, since_id, min_id },
    });
    return { statuses: items, ...cursors };
  },
});
