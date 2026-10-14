import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { DELIVERY_STATUSES, PUBLISHED_SORT_FIELDS, nuelinkPosts } from '../../common/operations';
import { nuelinkProps } from '../../common/props';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiListPublishedPosts = createAction({
  name: 'nuelink_list_published_posts',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Published Posts',
  description: 'Lists what Nuelink sent to each channel, with delivery status, post URL and engagement counts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists per-channel delivery results: status, platform URL, error message and engagement (likes, comments, shares, views, saves, clicks, impressions, reach). status defaults to PUBLISHED, so checking a postId with the defaults only shows the channels where it succeeded; query FAILED, RETRYING or SKIPPED to see failures. Filter by collectionId, channelId (nuelink_list_channels), postId (nuelink_list_brand_posts), postType, text search or publish time (UTC). One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    status: Property.StaticDropdown({
      displayName: 'Delivery Status',
      description: 'Defaults to PUBLISHED.',
      required: false,
      options: { options: DELIVERY_STATUSES.map((value) => ({ label: value, value })) },
    }),
    collectionId: nuelinkAiProps.collectionId({ required: false, description: 'Only results from this collection.' }),
    channelId: nuelinkAiProps.idText({ displayName: 'Channel ID', description: 'Only results for this channel (from nuelink_list_channels).', required: false }),
    postId: nuelinkAiProps.idText({ displayName: 'Post ID', description: 'Only results of this post.', required: false }),
    postType: Property.ShortText({ displayName: 'Post Type', description: 'Only results of this post type, e.g. IMAGE.', required: false }),
    search: Property.ShortText({ displayName: 'Search Text', description: 'Text contained in the published body (up to 255 characters).', required: false }),
    publishedFrom: Property.ShortText({ displayName: 'Published From', description: 'ISO-8601 time; without offset it is read as UTC.', required: false }),
    publishedTo: Property.ShortText({ displayName: 'Published To', description: 'ISO-8601 time; without offset it is read as UTC.', required: false }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: { options: PUBLISHED_SORT_FIELDS.map((value) => ({ label: value, value })) },
    }),
    sortOrder: nuelinkProps.sortOrder(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listPublishedPosts,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brandId, label: 'Brand ID' });
    return nuelinkPosts.listPublished({ apiKey, brandId, props, ids: { collection: props.collectionId, channel: props.channelId, post: props.postId } });
  },
});
