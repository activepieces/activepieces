import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";
import { discordAuth } from "../../index";
import { Channel, Guild } from "../trigger/new-message";
import { ExecutionType, PauseType } from "@activepieces/shared";

export const discordSendApprovalMessageWebhook = createAction({
    auth: discordAuth,
    name: 'send_approval_message_webhook',
    description: 'Send a discord approval message via webhook',
    displayName: 'Send Approval Message via Webhook',
    props: {
      content: Property.LongText({
        displayName: 'Message',
        description: "The message you want to send",
        required: true,
      }),
      channel: Property.Dropdown<string>({
        displayName: 'Channel',
        description: 'List of channels',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
          const request = {
              method: HttpMethod.GET,
              url: "https://discord.com/api/v9/users/@me/guilds",
              headers: {
                  "Authorization": "Bot " + auth,
              }
          };

          const res = await httpClient.sendRequest<Guild[]>(request);
          const options: { options: { value: string, label: string }[] } = { options: [] };

          await Promise.all(res.body.map(async (guild) => {
            const requestChannels = {
              method: HttpMethod.GET,
              url: "https://discord.com/api/v9/guilds/" + guild.id + "/channels",
              headers: {
                "Authorization": "Bot " + auth,
              }
            };

            const resChannels = await httpClient.sendRequest<Channel[]>(requestChannels);
            resChannels.body.forEach((channel) => {
              options.options.push({
                value: channel.id,
                label: channel.name
              });
            });
          }));

          return options;
        },
      }),
    },
    async run(configValue) {
      if (configValue.executionType === ExecutionType.BEGIN) {
        configValue.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            actions: ['approve', 'disapprove'],
          }
        });

        const approvalLink = `${configValue.serverUrl}v1/flow-runs/${configValue.run.id}/resume?action=approve`;
        const disapprovalLink = `${configValue.serverUrl}v1/flow-runs/${configValue.run.id}/resume?action=disapprove`;

        const request: HttpRequest<any> = {
          method: HttpMethod.POST,
          url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel}/messages`,
          body: {
            content: configValue.propsValue.content,
            components: [{
              type: 1,
              components: [
                {
                  type: 2,
                  label: "Approve",
                  style: 5,
                  url: approvalLink
                },
                {
                  type: 2,
                  label: "Disapprove",
                  style: 5,
                  url: disapprovalLink
                }
              ]
            }],
          },
          headers: {
            authorization: `Bot ${configValue.auth}`,
            "Content-Type": "application/json"
          }
        };
        
        await httpClient.sendRequest<never>(request);
        return {}
      } else {
        const payload = configValue.resumePayload as { action: string };
  
        return {
          approved: payload.action === 'approve',
        }
      }
    },
  
});
