import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { ExecutionType, PauseType } from '@activepieces/shared';
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
  async run(configValue) {
    if (configValue.executionType === ExecutionType.BEGIN) {
      configValue.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          actions: ['approve', 'disapprove'],
        },
      });

      const approvalLink = `${configValue.serverUrl}v1/flow-runs/${configValue.run.id}/resume?action=approve`;
      const disapprovalLink = `${configValue.serverUrl}v1/flow-runs/${configValue.run.id}/resume?action=disapprove`;

      const request: HttpRequest<any> = {
        method: HttpMethod.POST,
        url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel}/messages`,
        body: {
          content: configValue.propsValue.content,
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
          authorization: `Bot ${configValue.auth}`,
          'Content-Type': 'application/json',
        },
      };

      await httpClient.sendRequest<never>(request);
      return {};
    } else {
      const payload = configValue.resumePayload as { action: string };

      return {
        approved: payload.action === 'approve',
      };
    }
  },
});
