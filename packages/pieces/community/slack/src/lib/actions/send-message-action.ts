import { createAction, Property } from '@activepieces/pieces-framework';
import {
  profilePicture,
  slackChannel,
  username,
  blocks,
  slackInfo,
} from '../common/props';
import { processMessageTimestamp, slackSendMessage } from '../common/utils';
import { slackAuth } from '../../';

export const slackSendMessageAction = createAction({
  auth: slackAuth,
  name: 'send_channel_message',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  props: {
    info: slackInfo,
    channel: slackChannel,
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
    threadTs: Property.ShortText({
      displayName: 'Thread ts',
      description:
        'Provide the ts (timestamp) value of the **parent** message to make this message a reply. Do not use the ts value of the reply itself; use its parent instead. For example `1710304378.475129`.Alternatively, you can easily obtain the message link by clicking on the three dots next to the parent message and selecting the `Copy link` option.',
      required: false,
    }),
    blocks,
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, channel, username, profilePicture, threadTs, file, blocks } =
      context.propsValue;

    return slackSendMessage({
      token,
      text,
      username,
      profilePicture,
      conversationId: channel,
      threadTs: threadTs ? processMessageTimestamp(threadTs) : undefined,
      file,
      blocks,
    });
  },
});
