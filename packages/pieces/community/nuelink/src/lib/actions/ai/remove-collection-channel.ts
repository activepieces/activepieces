import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkCollectionChannels } from '../../common/operations';

export const aiRemoveCollectionChannel = createAction({
  name: 'nuelink_remove_collection_channel',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Remove Channel from Collection',
  description: 'Disconnects a channel from a collection. The channel stays connected to the brand.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a channel from a collection so the collection\'s posts stop going to it; the channel stays connected to the brand and nuelink_add_collection_channel restores it. Ask the user before removing, since queued posts will no longer reach that channel. A repeat call returns 404.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID from nuelink_list_collections.' }),
    channelId: nuelinkAiProps.idText({ displayName: 'Channel ID', description: 'The numeric channel ID, from the collection\'s channels in nuelink_list_collections.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.collectionChannel,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    const channelId = nuelinkClient.numericId({ value: context.propsValue.channelId, label: 'Channel ID' });
    return nuelinkCollectionChannels.remove({ apiKey, brandId, collectionId, channelId });
  },
});
