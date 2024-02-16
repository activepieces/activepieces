import { createAction } from '@activepieces/pieces-framework';
import { slackSendMessage } from '../common/utils';
import { slackAuth } from '../..';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import { profilePicture, text, userId, username } from '../common/props';

export const requestApprovalDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'request_approval_direct_message',
  displayName: 'Request Approval from A User',
  description:
    'Send approval message to a user and then wait until the message is approved or disapproved',
  props: {
    userId,
    text,
    username,
    profilePicture,
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });
      const token = context.auth.access_token;
      const { userId, username, profilePicture } = context.propsValue;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(text, 'text');
      assertNotNullOrUndefined(userId, 'userId');
      const approvalLink = context.generateResumeUrl({
        queryParams: { action: 'approve' },
      })
      const disapprovalLink = context.generateResumeUrl({
        queryParams: { action: 'disapprove' },
      })

      return await slackSendMessage({
        token,
        text: `${context.propsValue.text}\n\nApprove: ${approvalLink}\n\nDisapprove: ${disapprovalLink}`,
        username,
        profilePicture,
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
        conversationId: userId,
      });
    } else {

      return {
        approved: context.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
