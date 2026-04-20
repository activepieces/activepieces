import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { ExecutionType } from '@activepieces/shared';
import { discordCommon } from '../common';

export const discordSendApprovalMessage = createAction({
  auth: discordAuth,
  name: 'request_approval_message',
  description:
    'send a message to a channel asking for approval and wait for a response',
  displayName: 'Request Approval in a Channel',
  props: {
    content: Property.LongText({
      displayName: 'Message',
      description: 'The message you want to send',
      required: true,
    }),
    channel: discordCommon.channel,
  },
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      const waitpoint = await ctx.run.createWaitpoint({
        type: 'WEBHOOK',
      });

      const approvalLink = waitpoint.buildResumeUrl({
        queryParams: { action: 'approve' },
      });
      const disapprovalLink = waitpoint.buildResumeUrl({
        queryParams: { action: 'disapprove' },
      });

      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `https://discord.com/api/v9/channels/${ctx.propsValue.channel}/messages`,
        body: {
          content: ctx.propsValue.content,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Approve',
                  style: 5,
                  url: approvalLink,
                },
                {
                  type: 2,
                  label: 'Disapprove',
                  style: 5,
                  url: disapprovalLink,
                },
              ],
            },
          ],
        },
        headers: {
          authorization: `Bot ${ctx.auth.secret_text}`,
          'Content-Type': 'application/json',
        },
      };

      await httpClient.sendRequest<never>(request);

      ctx.run.waitForWaitpoint(waitpoint.id);

      return {};
    } else {
      return {
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
