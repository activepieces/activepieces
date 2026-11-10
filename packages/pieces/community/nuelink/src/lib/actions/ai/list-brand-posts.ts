import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';
import { POSTING_TYPES, POST_SORT_FIELDS, POST_STATUSES, POST_TYPES, VIEWS, nuelinkPosts } from '../../common/operations';
import { nuelinkProps } from '../../common/props';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiListBrandPosts = createAction({
  name: 'nuelink_list_brand_posts',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Posts',
  description: 'Lists a brand\'s posts (drafts, queued, scheduled, published), optionally for one collection, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists a brand\'s posts across collections, or one collection with collectionId, filtered by view, status, post type, posting type and creation time (createdFrom/createdTo are UTC). Use it to find a post ID or to check whether a create already happened. An unknown collectionId returns 404; get IDs from nuelink_list_collections. For per-channel delivery results use nuelink_list_published_posts. One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: false, description: 'Only posts of this collection (numeric ID from nuelink_list_collections). Empty for all.' }),
    view: staticOptions({ displayName: 'View', values: VIEWS, description: 'QUEUE, SCHEDULED, DRAFT or PUBLISHED.' }),
    status: staticOptions({ displayName: 'Status', values: POST_STATUSES, description: 'Lifecycle status.' }),
    postType: staticOptions({ displayName: 'Post Type', values: POST_TYPES, description: 'Content type.' }),
    postingType: staticOptions({ displayName: 'Posting Type', values: POSTING_TYPES, description: 'How the post is published.' }),
    createdFrom: Property.ShortText({ displayName: 'Created From', description: 'ISO-8601 time; a value without offset is read as UTC.', required: false }),
    createdTo: Property.ShortText({ displayName: 'Created To', description: 'ISO-8601 time; a value without offset is read as UTC.', required: false }),
    sortBy: staticOptions({ displayName: 'Sort By', values: POST_SORT_FIELDS, description: 'Sort field.' }),
    sortOrder: nuelinkProps.sortOrder(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listPosts,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkInputs.optionalId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    return nuelinkPosts.list({ apiKey, brandId, collectionId, props: context.propsValue });
  },
});

function staticOptions({ displayName, values, description }: { displayName: string; values: readonly string[]; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: { options: values.map((value) => ({ label: value, value })) },
  });
}
