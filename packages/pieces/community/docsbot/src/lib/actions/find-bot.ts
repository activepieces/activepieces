import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';

export const findBot = createAction({
  auth: DocsBotAuth,
  name: 'findBot',
  displayName: 'Find Bot',
  description: 'Find a bot by its name within a specified team.',
   props: {
    teamId: docsbotCommon.teamId,
    botName: Property.ShortText({
      displayName: "Bot Name",
      description: "Enter the name of the bot to find",
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { teamId, botName } = propsValue;

    const request = {
      method: HttpMethod.GET,
      url: `https://docsbot.ai/api/teams/${teamId}/bots`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    };

    const response = await httpClient.sendRequest<any[]>(request);

    if (!Array.isArray(response.body)) {
      throw new Error("Unexpected response from DocsBot API");
    }

    const matchedBot = response.body.find(
      (bot) => bot.name.toLowerCase() === botName.toLowerCase()
    );

    if (!matchedBot) {
      return { success: false, message: `No bot found with name "${botName}"` };
    }

    return {
      success: true,
      bot: matchedBot,
    };
  },
});
