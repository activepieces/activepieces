import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostConvertGroupMessageToChannelOutputSchema } from '../../../output-schemas';

export const createDirectChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_direct_channel',
  outputSchema: mattermostConvertGroupMessageToChannelOutputSchema,
  displayName: 'Create Direct Channel',
  description: 'Opens a direct message channel between the connected user and another user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Opens the one-to-one direct message channel (type "D") between the connected user and another user, or returns it if it already exists; post into it with Create Post. For 3 to 8 people use Create Group Message.',
    idempotent: true,
  },
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'ID (26 characters) of the other user. Use Get User By Username or Search Users to find it.',
      required: true,
    }),
  },
  async run(context) {
    const me = await mattermostApi.getMe({ auth: context.auth });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels/direct',
      body: [me.id, context.propsValue.userId],
    });
  },
});
