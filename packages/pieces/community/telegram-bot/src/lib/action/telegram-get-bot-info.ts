import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetBotInfo = createAction({
  auth: telegramBotAuth,
  name: 'telegram_get_bot_info',
  displayName: 'Get Bot Info',
  description: "Get the authenticated bot's own identity and capabilities.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the authenticated bot's own identity and capabilities (id, username, name, and which features such as inline mode or group joins are enabled). Use to confirm which bot the connection points at or to read the bot's @username before building an invite or mention. Read-only and takes no input.",
    idempotent: true,
  },
  props: {},
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getMe'),
      });
      return response.body;
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
