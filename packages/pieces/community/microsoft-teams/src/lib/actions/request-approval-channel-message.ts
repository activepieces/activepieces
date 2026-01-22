import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsAuth } from '../..';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import { ChatMessage } from '@microsoft/microsoft-graph-types';

export const requestApprovalInChannel = createAction({
  auth: microsoftTeamsAuth,
  name: 'request_approval_in_channel',
  displayName: 'Request Approval in Channel',
  description: 'Send approval message to a channel and then wait until the message is approved or disapproved',
  props: {
    teamId: microsoftTeamsCommon.teamId,
    channelId: microsoftTeamsCommon.channelId,
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const { teamId, channelId, message } = context.propsValue;
      const token = context.auth.access_token;

      assertNotNullOrUndefined(token, 'token');
      assertNotNullOrUndefined(teamId, 'teamId');
      assertNotNullOrUndefined(channelId, 'channelId');
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

      
      const chatMessage: ChatMessage = {
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
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
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
