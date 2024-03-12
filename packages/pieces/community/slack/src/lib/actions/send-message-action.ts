import { createAction, Property } from '@activepieces/pieces-framework';
import {
  profilePicture,
  slackChannel,
  username,
  blocks,
} from '../common/props';
import { slackSendMessage } from '../common/utils';
import { slackAuth } from '../../';

export const slackSendMessageAction = createAction({
  auth: slackAuth,
  name: 'send_channel_message',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  props: {
    channel: slackChannel,
    threadTs: Property.ShortText({
      displayName: 'Thread ts',
      description: 'Provide another message\'s ts value to make this message a reply. Avoid using a reply\'s ts value; use its parent instead.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of your message',
      required: true,
    }),
    username,
    profilePicture,
    file: Property.File({
      displayName: 'Attachment',
      required: false,
    }),
    blocks,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, channel, username, profilePicture, file, threadTs, blocks } =
      context.propsValue;

    return slackSendMessage({
      token,
      text,
      username,
      profilePicture,
      conversationId: channel,
      threadTs,
      file,
      blocks,
    });
  },
});
