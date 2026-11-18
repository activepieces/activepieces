import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const getChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Get Channel',
  description: 'Gets a channel by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one channel by ID: type ("O" public, "P" private, "D" direct, "G" group message), names, header, purpose and team. To look up by name use Get Channel By Name.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}`,
    });
  },
});
