import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import {
  profilePicture,
  text,
  slackChannel,
  username,
  actions,
  singleSelectChannelInfo,
  threadTs,
  mentionOriginFlow,
} from '../common/props';
import { requestAction } from '../common/request-action';

export const requestActionMessageAction = createAction({
  auth: slackAuth,
  name: 'request_action_message',
  displayName: 'Request Action in A Channel',
  description:
    'Send a message in a channel and wait until an action is selected',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a message with interactive action buttons to a Slack channel and pause the flow until a recipient clicks one, then resume with the chosen action. Pick this for human-in-the-loop branching in a shared channel; use Request Approval from A User for a private approve/disapprove DM. Not idempotent: each run posts a new message and creates a fresh wait.',
    idempotent: false,
  },
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
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
    const { channel } = context.propsValue;
    assertNotNullOrUndefined(channel, 'channel');

    return await requestAction(channel, context);
  },
});
