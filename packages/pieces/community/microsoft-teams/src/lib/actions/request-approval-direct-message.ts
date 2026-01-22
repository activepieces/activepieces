import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsAuth } from '../..';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';

export const requestApprovalDirectMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'request_approval_direct_message',
  displayName: 'Request Approval from a User',
  description:
    'Send approval message to a user and then wait until the message is approved or disapproved',
  props: {
    chatId: microsoftTeamsCommon.chatId,
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const { chatId, message } = context.propsValue;
      const token = context.auth.access_token;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(chatId, 'chatId');
      assertNotNullOrUndefined(message, 'message');

      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(token),
        },
      });
      const attachmentId = Date.now().toString();
      const approvalLink = context.generateResumeUrl({
        queryParams: { action: 'approve' },
      });
      const disapprovalLink = context.generateResumeUrl({
        queryParams: { action: 'disapprove' },
      });

      const chatMessage = {
        body: {
          contentType: 'html',
          content: `${message}<attachment id="${attachmentId}"></attachment>`,
        },
        attachments: [
          {
            id: attachmentId,
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: JSON.stringify({
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'TextBlock',
                  text: 'Please choose an action:',
                },
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: 'Approve',
                  url: approvalLink,
                  style: 'positive',
                },
                {
                  type: 'Action.OpenUrl',
                  title: 'Disapprove',
                  url: disapprovalLink,
                  style: 'destructive',
                },
              ],
            }),
          },
        ],
      };

      // Send the message
      const response = await client
        .api(`/chats/${chatId}/messages`)
        .post(chatMessage);

      context.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });

      return {
        approved: false, // default approval is false
      };
    } else {
      return {
        approved: context.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
