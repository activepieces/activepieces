import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { profilePicture, text, slackChannel, onlyBotChannels, username, actions, singleSelectChannelInfo, threadTs, mentionOriginFlow, replyBroadcast, customBlocks } from '../common/props';
import { requestAction } from '../common/request-action';
import { requestActionActionOutputSchema } from '../output-schemas';

export const requestActionMessageAction = createAction({
  auth: slackAuth,
  name: 'request_action_message',
  classification: 'WRITE',
  displayName: 'Request Action in A Channel',
  description:
    'Send a message in a channel and wait until an action is selected',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a message with interactive action buttons to a Slack channel and pause the flow until a recipient clicks one, then resume with the chosen action. Pick this for human-in-the-loop branching in a shared channel; use Request Approval from A User for a private approve/disapprove DM. Not idempotent: each run posts a new message and creates a fresh wait.',
    idempotent: false,
  },
  outputSchema: requestActionActionOutputSchema,
  propertyGroups: [
    {
      key: 'channel_picker',
      display: 'section',
      label: 'Channel',
      icon: 'markdown',
      props: ['info', 'onlyBotChannels', 'channel'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['text', 'actions', 'threadTs'],
    },
  ],
  props: {
    info: singleSelectChannelInfo,
    onlyBotChannels,
    channel: slackChannel(true),
    text,
    actions,
    blocks: customBlocks,
    threadTs,
    username,
    profilePicture,
    replyBroadcast,
    mentionOriginFlow,
  },
  async run(context) {
    const { channel } = context.propsValue;
    assertNotNullOrUndefined(channel, 'channel');

    return await requestAction(channel, context);
  },
});
