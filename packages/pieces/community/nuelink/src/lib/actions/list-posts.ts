import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkInputs } from '../common/inputs';
import { POST_TYPES, nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const listPosts = createAction({
  name: 'list_posts',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Posts',
  description: 'Lists a brand\'s drafts, queued, scheduled and published posts, one page at a time.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists a brand\'s posts (drafts, queued, scheduled, published), optionally for one collection, with type and creation-date filters, one page at a time (hasMore says whether to ask for the next page). Use it to find a post ID or to check what is queued. Use List Published Posts for delivery status and engagement. Read-only.',
    idempotent: true,
  },
  props: {
    brand: nuelinkProps.brand(),
    collection: nuelinkProps.collection({ required: false, description: 'Only list posts of this collection. Leave empty for all collections.' }),
    view: Property.StaticDropdown({
      displayName: 'Show',
      description: 'Which kind of posts to list. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Queued', value: 'QUEUE' },
          { label: 'Scheduled', value: 'SCHEDULED' },
          { label: 'Drafts', value: 'DRAFT' },
          { label: 'Published', value: 'PUBLISHED' },
        ],
      },
    }),
    postType: Property.StaticDropdown({
      displayName: 'Post Type',
      required: false,
      options: { options: POST_TYPES.map((type) => ({ label: titleCase({ text: type }), value: type })) },
    }),
    createdFrom: Property.DateTime({
      displayName: 'Created From',
      description: 'Only posts created at or after this time. A time without a timezone is read as UTC.',
      required: false,
    }),
    createdTo: Property.DateTime({
      displayName: 'Created To',
      description: 'Only posts created at or before this time. A time without a timezone is read as UTC.',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'Post ID', value: 'id' },
          { label: 'Title', value: 'title' },
          { label: 'Scheduled date', value: 'post_date' },
          { label: 'Created date', value: 'created_at' },
          { label: 'Updated date', value: 'updated_at' },
        ],
      },
    }),
    sortOrder: nuelinkProps.sortOrder(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listPosts,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brand, label: 'Brand' });
    const collectionId = nuelinkInputs.optionalId({ value: context.propsValue.collection, label: 'Collection' });
    return nuelinkPosts.list({ apiKey, brandId, collectionId, props: context.propsValue });
  },
});

function titleCase({ text }: { text: string }): string {
  return text
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
