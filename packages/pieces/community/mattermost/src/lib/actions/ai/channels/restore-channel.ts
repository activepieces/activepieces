import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const restoreChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_restore_channel',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Restore Channel',
  description: 'Restores an archived channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Unarchives a channel archived by Archive Channel, making it active again. Find archived channels with List Archived Channels. Fails if the channel is not archived.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({
      required: true,
      description: 'ID (26 characters) of the archived channel. Use List Archived Channels to find it.',
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}/restore`,
    });
  },
});
