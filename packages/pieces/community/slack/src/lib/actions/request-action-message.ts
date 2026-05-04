import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined, ExecutionType } from '@activepieces/shared';
import {
  autoAddBot,
  profilePicture,
  text,
  slackChannel,
  username,
  actions,
  singleSelectChannelInfo,
  threadTs,
  mentionOriginFlow,
} from '../common/props';
import { tryAddBotToChannel } from '../common/utils';
import { requestAction } from '../common/request-action';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const requestActionMessageAction = createAction({
  auth: slackAuth,
  name: 'request_action_message',
  displayName: 'Request Action in A Channel',
  description:
    'Send a message in a channel and wait until an action is selected',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    autoAddBot,
    text,
    actions,
    threadTs,
    username,
    profilePicture,
    replyBroadcast: Property.Checkbox({
      displayName: 'Broadcast reply to channel',
      description: 'When replying to a thread, also make the message visible to everyone in the channel (only applicable when Thread Timestamp is provided)',
      required: false,
      defaultValue: false,
    }),
    mentionOriginFlow,
  },
  async run(context) {
    const { channel, autoAddBot: shouldAddBot } = context.propsValue;
    assertNotNullOrUndefined(channel, 'channel');

    if (shouldAddBot && context.executionType === ExecutionType.BEGIN) {
      await tryAddBotToChannel({
        botToken: getBotToken(context.auth as SlackAuthValue),
        userToken: getUserToken(context.auth as SlackAuthValue),
        channel,
      });
    }

    return await requestAction(channel, context);
  },
});
