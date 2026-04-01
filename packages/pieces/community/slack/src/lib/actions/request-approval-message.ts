import { createAction } from '@activepieces/pieces-framework';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks } from '../common/utils';
import { slackAuth } from '../auth';
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
  mentionOriginFlow,
} from '../common/props';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

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
    mentionOriginFlow,
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = getBotToken(context.auth as SlackAuthValue);
      const { channel, username, profilePicture, mentionOriginFlow } = context.propsValue;

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
          ...textToSectionBlocks(`${context.propsValue.text}`),
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
                value: approvalLink,
                action_id: 'approve',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Disapprove',
                },
                style: 'danger',
                value: disapprovalLink,
                action_id: 'disapprove',
              },
            ],
          },
          ...(mentionOriginFlow ? [buildFlowOriginContextBlock(context)] : []),
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
      const approved = context.resumePayload.queryParams['action'] === 'approve';
      const channel = context.resumePayload.queryParams['channel'];
      const messageTs = context.resumePayload.queryParams['messageTs'];

      const token = getBotToken(context.auth as SlackAuthValue);
      try {
        if (token && channel && messageTs) {
          const client = new WebClient(token);
          const statusText = approved ? 'Approved' : 'Disapproved';
          await client.chat.update({
            channel,
            ts: messageTs,
            text: `${context.propsValue.text}\n\n${statusText}`,
            blocks: [
              ...textToSectionBlocks(`${context.propsValue.text}`),
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: approved
                    ? ':white_check_mark: *Approved*'
                    : ':x: *Disapproved*',
                },
              },
            ],
          });
        }
      } catch (e) {
        // Ignore errors from updating the message, as it's cosmetic
      }

      return { approved, messageTs };
    }
  },
});
