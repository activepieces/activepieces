import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsAuth } from '../auth';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import type { ChatMessage } from '../common/types';
import { requestApprovalDirectMessageOutputSchema } from '../output-schemas';

export const requestApprovalInChannel = createAction({
  auth: microsoftTeamsAuth,
  name: 'request_approval_in_channel',
  outputSchema: requestApprovalDirectMessageOutputSchema,
  classification: 'WRITE',
  displayName: 'Request Approval in Channel',
  description: 'Send approval message to a channel and then wait until the message is approved or disapproved',
  audience: 'both',
  aiMetadata: {
    description: 'Posts an adaptive card with a single button linking to a confirmation page (where the recipient chooses Approve or Disapprove) into a Microsoft Teams channel (by team ID and channel ID) and pauses the flow until they respond, then resumes reporting whether it was approved. Use as a human-in-the-loop gate where channel members decide; for a direct-message gate use Request Approval from a User instead. Not idempotent — each call posts another approval message and creates a new wait.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsProps.teamId({ required: true }),
    channelId: microsoftTeamsProps.channelId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const { teamId, channelId, message } = context.propsValue;
      assertNotNullOrUndefined(context.auth.access_token, 'token');
      assertNotNullOrUndefined(teamId, 'teamId');
      assertNotNullOrUndefined(channelId, 'channelId');
      assertNotNullOrUndefined(message, 'message');

      const client = microsoftTeamsClient.create({ auth: context.auth });

      const attachmentId = Date.now().toString();
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
      });
      const confirmationLink = `${waitpoint.resumeUrl}/confirm`;

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
                  title: 'Review & Respond',
                  url: confirmationLink,
                },
              ],
            }),
          },
        ],
      };

      await client
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post(chatMessage);

      context.run.waitForWaitpoint(waitpoint.id);
      return {
        approved: false,
      };
    } else {
      return {
        approved: context.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
