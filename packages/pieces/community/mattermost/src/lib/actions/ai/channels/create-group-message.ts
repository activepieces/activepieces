import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostConvertGroupMessageToChannelOutputSchema } from '../../../output-schemas';

export const createGroupMessageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_group_message',
  outputSchema: mattermostConvertGroupMessageToChannelOutputSchema,
  displayName: 'Create Group Message',
  description: 'Opens a group message channel with 3 to 8 people.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Opens a group message channel (type "G"), a direct conversation of 3 to 8 people including the connected user, or returns the existing one for the same people; post into it with Create Post. This is not a user group. For one other person use Create Direct Channel.',
    idempotent: true,
  },
  props: {
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'IDs of the 2 to 7 other users. The connected user is added automatically. Use Get User By Username or Search Users to find them.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels/group',
      body: context.propsValue.userIds,
    });
  },
});
