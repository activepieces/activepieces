import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const listPublishedPosts = createAction({
  name: 'list_published_posts',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Published Posts',
  description: 'Lists what Nuelink sent to each channel, with the delivery status, the link to the post and its engagement counts.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists what Nuelink actually sent to each channel, one entry per channel: delivery status (published, failed, retrying, skipped), the platform post URL, and engagement counts (likes, comments, shares, views, saves, clicks, impressions, reach). Filter by collection, channel, source post, text search or publish date; one page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brand: nuelinkProps.brand(),
    status: Property.StaticDropdown({
      displayName: 'Delivery Status',
      required: false,
      defaultValue: 'PUBLISHED',
      options: {
        options: [
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Failed', value: 'FAILED' },
          { label: 'Retrying', value: 'RETRYING' },
          { label: 'Skipped', value: 'SKIPPED' },
          { label: 'Sent', value: 'SENT' },
        ],
      },
    }),
    collection: nuelinkProps.collection({ required: false, description: 'Only results from this collection. Leave empty for all collections.' }),
    channel: nuelinkProps.channel(),
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'Only results of this Nuelink post (the ID from Create Post in Collection or List Posts).',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search Text',
      description: 'Only results whose published text contains this (not case-sensitive, up to 255 characters).',
      required: false,
    }),
    publishedFrom: Property.DateTime({
      displayName: 'Published From',
      description: 'Only results published at or after this time. A time without a timezone is read as UTC.',
      required: false,
    }),
    publishedTo: Property.DateTime({
      displayName: 'Published To',
      description: 'Only results published at or before this time. A time without a timezone is read as UTC.',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'Newest (ID)', value: 'id' },
          { label: 'Created date', value: 'created_at' },
          { label: 'Likes', value: 'likes' },
          { label: 'Comments', value: 'comments' },
          { label: 'Shares', value: 'shares' },
        ],
      },
    }),
    sortOrder: nuelinkProps.sortOrder(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listPublishedPosts,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brand, label: 'Brand' });
    return nuelinkPosts.listPublished({ apiKey, brandId, props, ids: { collection: props.collection, channel: props.channel, post: props.postId } });
  },
});
