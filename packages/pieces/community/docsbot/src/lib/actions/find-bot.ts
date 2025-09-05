import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import {  HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';
import { makeRequest } from '../common/client';

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

    const bots = await makeRequest(
      auth,
      HttpMethod.GET,
      `/api/teams/${teamId}/bots`
    );

    if (!Array.isArray(bots)) {
      throw new Error("Unexpected response from DocsBot API — expected an array of bots.");
    }

    const matchedBot = bots.find(
      (bot: any) => bot.name?.toLowerCase() === botName.toLowerCase()
    );

    if (!matchedBot) {
      return {
        success: false,
        message: `No bot found with name "${botName}"`,
      };
    }

    return {
      success: true,
      bot: matchedBot,
    };
  },
});