import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsAuth } from '../auth';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';

export const requestApprovalDirectMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'request_approval_direct_message',
  displayName: 'Request Approval from a User',
  description:
    'Send approval message to a user and then wait until the message is approved or disapproved',
  audience: 'both',
  aiMetadata: {
    description: 'Posts an adaptive card with a single button linking to a confirmation page (where the recipient chooses Approve or Disapprove) into a Microsoft Teams chat (by chat ID) and pauses the flow until they respond, then resumes reporting whether it was approved. Use as a human-in-the-loop gate targeting a specific person via direct chat; for a channel-wide gate use Request Approval in Channel instead. Not idempotent — each call posts another approval message and creates a new wait.',
    idempotent: false,
  },
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

      const cloud = context.auth.props?.['cloud'] as string | undefined;
      const client = createGraphClient(token, cloud);
      const attachmentId = Date.now().toString();
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });
      const confirmationLink = `${waitpoint.resumeUrl}/confirm`;

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
                  title: 'Review & Respond',
                  url: confirmationLink,
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

      context.run.waitForWaitpoint(waitpoint.id);

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
