import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
      description: 'Without the # sign; a leading # is removed.',
      placeholder: 'mastodon',
      required: true,
    }),
    any: Property.Array({
      displayName: 'Any of These Tags',
      description: 'Also include statuses with any of these tags, one per item.',
      required: false,
    }),
    all: Property.Array({
      displayName: 'All of These Tags',
      description: 'Only statuses that also have all of these tags, one per item.',
      required: false,
    }),
    none: Property.Array({
      displayName: 'None of These Tags',
      description: 'Leave out statuses with any of these tags, one per item.',
      required: false,
    }),
    source_info: Property.MarkDown({
      value: 'Turn on Only Local or Only Remote, not both.',
      variant: MarkdownVariant.WARNING,
    }),
    local: Property.Checkbox({
      displayName: 'Only Local Statuses',
      description: 'Only statuses from accounts on your server.',
      required: false,
      defaultValue: false,
    }),
    remote: Property.Checkbox({
      displayName: 'Only Remote Statuses',
      description: 'Only statuses from accounts on other servers.',
      required: false,
      defaultValue: false,
    }),
    only_media: Property.Checkbox({
      displayName: 'Only Statuses with Media',
      description: 'Only statuses with images, video or audio.',
      required: false,
      defaultValue: false,
    }),
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId({ advanced: true }),
    since_id: mastodonProps.sinceId({ advanced: true }),
    min_id: mastodonProps.minId({ advanced: true }),
  },
  propertyGroups: [
    { key: 'tags', display: 'section', label: 'Tags', icon: 'tag', props: ['hashtag', 'any', 'all', 'none'] },
    {
      key: 'source',
      display: 'section',
      label: 'Source',
      icon: 'filter',
      props: ['source_info', 'local', 'remote', 'only_media'],
    },
  ],
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
