import { createAction } from '@activepieces/pieces-framework';
import { slackSendMessage } from '../common/utils';
import { slackAuth } from '../../';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { profilePicture, text, userId, username } from '../common/props';

export const slackSendDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'send_direct_message',
  displayName: 'Send Message To A User',
  description: 'Send message to a user',
  props: {
    userId,
    text,
    username,
    profilePicture,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, userId } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');
    assertNotNullOrUndefined(userId, 'userId');

    return slackSendMessage({
      token,
      text,
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      conversationId: userId,
    });
  },
});

type UserListResponse = {
  members: {
    id: string;
    name: string;
  }[];
};
