import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkCollectionChannels } from '../../common/operations';

export const aiAddCollectionChannel = createAction({
  name: 'nuelink_add_collection_channel',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Add Channel to Collection',
  description: 'Connects one of the brand\'s channels to a collection, so the collection\'s posts publish there too.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a brand channel (from nuelink_list_channels) to a collection. The channel then receives ALL of the collection\'s posts, including ones already queued and scheduled, not only future ones: call nuelink_list_collections first and confirm its postsCount.queued and scheduled with the user. To stage a channel without publishing, pause the collection first with nuelink_update_collection status PAUSED. Adding a channel that is already assigned changes nothing.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID from nuelink_list_collections.' }),
    channelId: nuelinkAiProps.idText({ displayName: 'Channel ID', description: 'The numeric channel ID from nuelink_list_channels.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.collectionChannel,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    const channelId = nuelinkClient.bodyId({ value: context.propsValue.channelId, label: 'Channel ID' });
    return nuelinkCollectionChannels.add({ apiKey, brandId, collectionId, channelId });
  },
});
