import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkInputs } from '../../common/inputs';
import { nuelinkProps } from '../../common/props';

export const aiListChannels = createAction({
  name: 'nuelink_list_channels',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Channels',
  description: 'Lists the social channels connected to a brand.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the social channels connected to the brand (id, name, platform type, status), including ones not in any collection yet. Use it to find a channelId for nuelink_add_collection_channel, nuelink_remove_collection_channel or nuelink_list_published_posts. Pages can be short or empty while total is above 0 (Nuelink counts before filtering), so follow hasMore, not the item count. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listChannels,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const { page, perPage } = nuelinkInputs.paging({ page: context.propsValue.page, perPage: context.propsValue.perPage });
    return nuelinkClient.getPage({ apiKey, path: ['brands', brandId, 'channels'], page, perPage });
  },
});
