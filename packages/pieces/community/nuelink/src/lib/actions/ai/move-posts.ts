import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkInputs } from '../../common/inputs';

export const aiMovePosts = createAction({
  name: 'nuelink_move_posts',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Move Posts to Collection',
  description: 'Moves up to 100 posts from one collection to another in the same brand.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves 1 to 100 posts (IDs from nuelink_list_brand_posts) from a source collection to a different destination collection. All or nothing: if any post is not in the source, nothing moves. Moved posts go to the destination\'s channels unless a post has its own channels set in the dashboard, so read the destination\'s channels with nuelink_list_collections and show them to the user first. A queued post takes the destination\'s next free slot and can publish sooner; a scheduled post keeps its date. The destination must be active and have capacity (403). A repeat call fails.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    sourceCollectionId: nuelinkAiProps.idText({ displayName: 'Source Collection ID', description: 'The collection that currently holds every listed post.', required: true }),
    destinationCollectionId: nuelinkAiProps.idText({ displayName: 'Destination Collection ID', description: 'A different collection of the same brand.', required: true }),
    postIds: Property.Array({ displayName: 'Post IDs', description: '1 to 100 numeric post IDs.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.movePosts,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brandId, label: 'Brand ID' });
    const sourceCollectionId = nuelinkClient.bodyId({ value: props.sourceCollectionId, label: 'Source Collection ID' });
    const destinationCollectionId = nuelinkClient.bodyId({ value: props.destinationCollectionId, label: 'Destination Collection ID' });
    if (sourceCollectionId === destinationCollectionId) {
      throw new Error('Source and destination collection must be different.');
    }
    const postIds = nuelinkInputs.bodyIds({ value: props.postIds, label: 'Post IDs', maxItems: 100 });
    if (postIds.length === 0) {
      throw new Error('Post IDs needs at least one post ID.');
    }
    return nuelinkClient.request({
      apiKey,
      method: HttpMethod.PATCH,
      path: ['brands', brandId, 'posts', 'move'],
      body: { sourceCollectionId, destinationCollectionId, postIds },
    });
  },
});
