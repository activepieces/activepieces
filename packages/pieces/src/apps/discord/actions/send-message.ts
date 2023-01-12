import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property/prop.model';
import { discordCommon } from '../common';

export const discordSendMessage = createAction({
  name: 'send_message',
  description: 'Send a discord message',
  displayName: 'Send Message',
  props: {
    authentication: discordCommon.authentication,
    bot_token: discordCommon.bot_token,
    channel: discordCommon.channel,
    content: Property.LongText({
      displayName: 'Message',
      required: true,
      secret: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<{ content: string }> = {
      method: HttpMethod.POST,
      url: `${discordCommon.baseUrl}/channels/${configValue.propsValue['channel']}/messages`,
      headers: {
        Authorization: `Bot ${configValue.propsValue['bot_token']}`,
      },
      body: {
        content: configValue.propsValue['content']!,
      },
    };
      return await httpClient.sendRequest<never>(request);
  },
});
