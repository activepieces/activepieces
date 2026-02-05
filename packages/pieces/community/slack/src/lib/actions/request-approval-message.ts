import { createAction } from '@activepieces/pieces-framework';
import { slackSendMessage } from '../common/utils';
import { slackAuth } from '../..';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import {
  profilePicture,
  singleSelectChannelInfo,
  slackChannel,
  text,
  username,
} from '../common/props';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';

export const requestSendApprovalMessageAction = createAction({
  auth: slackAuth,
  name: 'request_approval_message',
  displayName: 'Request Approval in a Channel',
  description:
    'Send approval message to a channel and then wait until the message is approved or disapproved',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    text,
    username,
    profilePicture,
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = context.auth.access_token;
      const { channel, username, profilePicture } = context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(text, 'text');
      assertNotNullOrUndefined(channel, 'channel');

      const postMessage = await slackSendMessage({
        token,
        text: `${context.propsValue.text}`,
        username,
        profilePicture,
        conversationId: channel,
      });
      const messageTs = (postMessage as ChatPostMessageResponse).ts as string

      const approvalLink = context.generateResumeUrl({
        queryParams: { action: 'approve', channel, messageTs },
      });
      const disapprovalLink = context.generateResumeUrl({
        queryParams: { action: 'disapprove', channel, messageTs },
      });

      const client = new WebClient(token);
      await client.chat.update({
        channel: channel,
        ts: messageTs,
        text: context.propsValue.text,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${context.propsValue.text}`,
            },
          },
          {
            type: 'actions',
            block_id: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Approve',
                },
                style: 'primary',
                url: approvalLink,
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Disapprove',
                },
                style: 'danger',
                url: disapprovalLink,
              },
            ],
          },
        ],
      });

      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });

      return {
        approved: false, // default approval is false
        messageTs
      };
    } else {
      return {
        approved: context.resumePayload.queryParams['action'] === 'approve',
        messageTs: context.resumePayload.queryParams['messageTs']
      };
    }
  },
});
