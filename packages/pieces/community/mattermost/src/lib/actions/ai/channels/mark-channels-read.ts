import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostMarkChannelsReadOutputSchema } from '../../../output-schemas';

export const markChannelsReadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_mark_channels_read',
  outputSchema: mattermostMarkChannelsReadOutputSchema,
  displayName: 'Mark Channels Read',
  description: 'Marks channels as read for a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one or more channels as read up to now for a user, clearing their unread and mention counts; pass "me" for the connected account.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'IDs of the channels to mark read. Use List User Channels to find them.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, channelIds } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/members/${encodeURIComponent(userId)}/mark_read`,
      body: channelIds,
    });
  },
});
