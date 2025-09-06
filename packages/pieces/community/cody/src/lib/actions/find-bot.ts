import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Bot } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findBotAction = createAction({
  auth: codyAuth,
  name: 'find_bot',
  displayName: 'Find Bot',
  description: 'Finds bot based on name',
  props: {
    name: Property.ShortText({
      displayName: 'Bot Name',
      required: true,
      description: 'The name of the bot to search for',
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      required: false,
      description: 'Whether to search for exact name match or partial match',
      defaultValue: false,
    }),
  },
  async run(context) {
    const { name, exact_match } = context.propsValue;

    const response = await makeRequest<Bot[]>(
      HttpMethod.GET,
      `/bots?search=${encodeURIComponent(name)}&exact_match=${exact_match}`,
      context.auth
    );

    if (!response.success) {
      throw new Error(`Failed to find bot: ${response.error}`);
    }

    const bots = response.data;
    
    if (bots.length === 0) {
      throw new Error(`No bot found with name: ${name}`);
    }

    // Return the first matching bot or the exact match
    const exactBot = exact_match 
      ? bots.find(bot => bot.name.toLowerCase() === name.toLowerCase())
      : bots[0];

    if (!exactBot && exact_match) {
      throw new Error(`No bot found with exact name: ${name}`);
    }

    return exactBot || bots[0];
  },
});