import { createAction } from '@activepieces/pieces-framework';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks, tryAddBotToChannel } from '../common/utils';
import { slackAuth } from '../auth';
import {
  assertNotNullOrUndefined,
  ExecutionType,
} from '@activepieces/shared';
import {
  autoAddBot,
  profilePicture,
  singleSelectChannelInfo,
  slackChannel,
  text,
  username,
  mentionOriginFlow,
} from '../common/props';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const requestSendApprovalMessageAction = createAction({
  auth: slackAuth,
  name: 'request_approval_message',
  displayName: 'Request Approval in a Channel',
  description:
    'Send approval message to a channel and then wait until the message is approved or disapproved',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    autoAddBot,
    text,
    username,
    profilePicture,
    mentionOriginFlow,
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const token = getBotToken(context.auth as SlackAuthValue);
      const { channel, username, profilePicture, mentionOriginFlow, autoAddBot: shouldAddBot } = context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(text, 'text');
      assertNotNullOrUndefined(channel, 'channel');

      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });

      if (shouldAddBot) {
        await tryAddBotToChannel({
          botToken: token,
          userToken: getUserToken(context.auth as SlackAuthValue),
          channel,
        });
      }

      const postMessage = await slackSendMessage({
        token,
        text: `${context.propsValue.text}`,
        username,
        profilePicture,
        conversationId: channel,
      });
      const messageTs = (postMessage as ChatPostMessageResponse).ts as string;

      const approvalLink = waitpoint.buildResumeUrl({
        queryParams: { action: 'approve', channel, messageTs },
      });
      const disapprovalLink = waitpoint.buildResumeUrl({
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

      context.run.waitForWaitpoint(waitpoint.id);

      return {
        approved: false,
        messageTs,
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
