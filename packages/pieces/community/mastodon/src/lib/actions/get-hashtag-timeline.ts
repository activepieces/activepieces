import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const getHashtagTimeline = createAction({
  auth: mastodonAuth,
  name: 'get_hashtag_timeline',
  classification: 'SEARCH',
  displayName: 'Get Hashtag Timeline',
  description: 'Get recent public statuses that use a hashtag.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of recent public statuses using a hashtag, newest first, with cursors for further pages; combine extra tags with any, all or none. Use Search for free-text queries. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    hashtag: Property.ShortText({
      displayName: 'Hashtag',
      description: 'Hashtag without the # sign, for example mastodon. A leading # is removed automatically.',
      required: true,
    }),
    any: Property.Array({
      displayName: 'Any of These Tags',
      description: 'Also include statuses using any of these additional hashtags, one per item, without #.',
      required: false,
    }),
    all: Property.Array({
      displayName: 'All of These Tags',
      description: 'Only statuses that also use all of these hashtags, one per item, without #.',
      required: false,
    }),
    none: Property.Array({
      displayName: 'None of These Tags',
      description: 'Exclude statuses using any of these hashtags, one per item, without #.',
      required: false,
    }),
    local: Property.Checkbox({
      displayName: 'Only Local Statuses',
      description: 'Only include statuses posted by accounts on your own server.',
      required: false,
      defaultValue: false,
    }),
    remote: Property.Checkbox({
      displayName: 'Only Remote Statuses',
      description: 'Only include statuses posted by accounts on other servers.',
      required: false,
      defaultValue: false,
    }),
    only_media: Property.Checkbox({
      displayName: 'Only Statuses With Media',
      description: 'Only include statuses that have images, video or audio attached.',
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
    const hashtag = props.hashtag.trim().replace(/^#/, '');
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/timelines/tag/${encodeURIComponent(hashtag)}`,
      operation: 'Get Hashtag Timeline',
      scope: 'read:statuses',
      query: {
        any: stripHashes({ tags: mastodonUtils.toStringArray(props.any) }),
        all: stripHashes({ tags: mastodonUtils.toStringArray(props.all) }),
        none: stripHashes({ tags: mastodonUtils.toStringArray(props.none) }),
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

function stripHashes({ tags }: { tags: string[] | undefined }): string[] | undefined {
  return tags?.map((tag) => tag.replace(/^#/, ''));
}
