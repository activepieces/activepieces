import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const discordSendMessageWebhook = createAction({
name: 'send_message_webhook',
  description: 'Send a discord message via webhook',
  displayName: 'Send Message Webhook',
  props: {
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<{ content: string }> = {
      method: HttpMethod.POST,
      url: configValue.propsValue['webhook_url'],
      body: {
        content: configValue.propsValue['content'],
      },
    };
      return await httpClient.sendRequest<never>(request);
  },
});
