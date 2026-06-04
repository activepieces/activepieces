import { createAction } from '@activepieces/pieces-framework';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks } from '../common/utils';
import { slackAuth } from '../auth';
import {
  assertNotNullOrUndefined,
  ExecutionType,
} from '@activepieces/shared';
import { profilePicture, text, userId, username, mentionOriginFlow } from '../common/props';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const requestApprovalDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'request_approval_direct_message',
  displayName: 'Request Approval from A User',
  description:
    'Send approval message to a user and then wait until the message is approved or disapproved',
  props: {
    userId: userId(true),
    text,
    username,
    profilePicture,
    mentionOriginFlow,
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = getBotToken(context.auth as SlackAuthValue);
      const { userId, username, profilePicture, mentionOriginFlow } = context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(text, 'text');
      assertNotNullOrUndefined(userId, 'userId');
      
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });

      const postMessage = await slackSendMessage({
        token,
        text: `${context.propsValue.text}`,
        username,
        profilePicture,
        conversationId: userId,
      });

      const dmId = (postMessage as ChatPostMessageResponse).channel as string;
      const messageTs = (postMessage as ChatPostMessageResponse).ts as string

      const approvalLink = waitpoint.buildResumeUrl({
        queryParams: { action: 'approve', channel: dmId, messageTs },
      });
      const disapprovalLink = waitpoint.buildResumeUrl({
        queryParams: { action: 'disapprove', channel: dmId, messageTs },
      });

      const client = new WebClient(token);
      await client.chat.update({
        ts:messageTs,
        channel:dmId,
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

      context.run.waitForWaitpoint(waitpoint.id);

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
