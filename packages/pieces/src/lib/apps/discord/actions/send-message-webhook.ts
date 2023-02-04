import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property';

export const discordSendMessageWebhook = createAction({
name: 'send_message_webhook',
  description: 'Send a discord message via webhook',
  displayName: 'Send Message Webhook',
  props: {
    webhook_url: Property.ShortText({
      displayName: 'Weebhook URL',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: configValue.propsValue['webhook_url']!,
      body: {
        content: configValue.propsValue['content']!,
      },
    };
      return await httpClient.sendRequest<never>(request);
  },
});
