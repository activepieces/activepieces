import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';
import { nuelinkProps } from '../../common/props';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiListCollections = createAction({
  name: 'nuelink_list_collections',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Collections',
  description: 'Lists a brand\'s collections with their channels, queue slots and post counts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists a brand\'s collections with their connected channels, weekly queue slots (brand timezone) and post counts. Use it to choose the collectionId for nuelink_create_post, nuelink_move_posts or nuelink_add_collection_channel, and to read queues[].id for nuelink_delete_collection_queue_slot; the collection\'s channels are where the post will go, and a collection with no channels publishes nowhere. The collection timezone may be an offset such as +03:00; queue slots are in the brand timezone. One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The numeric brand ID from List Brands.',
      required: true,
    }),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listCollections,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const { page, perPage } = nuelinkInputs.paging({ page: context.propsValue.page, perPage: context.propsValue.perPage });
    return nuelinkClient.getPage({ apiKey, path: ['brands', brandId, 'collections'], page, perPage });
  },
});
