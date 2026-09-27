import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const getPublicTimeline = createAction({
  auth: mastodonAuth,
  name: 'get_public_timeline',
  classification: 'SEARCH',
  displayName: 'Get Public Timeline',
  description: 'Get recent public statuses known to the server.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of recent public statuses known to the connected server (optionally only local or only remote, or only with media), newest first, with cursors for further pages. Use Get Hashtag Timeline for a topic or Get Home Timeline for followed accounts. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    local: Property.Checkbox({
      displayName: 'Only Local Statuses',
      description: 'Only statuses posted on this server.',
      required: false,
      defaultValue: false,
    }),
    remote: Property.Checkbox({
      displayName: 'Only Remote Statuses',
      description: 'Only statuses from other servers.',
      required: false,
      defaultValue: false,
    }),
    only_media: Property.Checkbox({
      displayName: 'Only Statuses With Media',
      required: false,
      defaultValue: false,
    }),
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const props = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/timelines/public',
      operation: 'Get Public Timeline',
      scope: 'read:statuses',
      query: {
        local: props.local === true ? true : undefined,
        remote: props.remote === true ? true : undefined,
        only_media: props.only_media === true ? true : undefined,
        limit: props.limit,
        max_id: props.max_id,
        since_id: props.since_id,
        min_id: props.min_id,
      },
    });
    return { statuses: items, ...cursors };
  },
});
