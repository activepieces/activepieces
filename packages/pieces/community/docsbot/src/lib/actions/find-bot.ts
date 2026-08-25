import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { docsbotAuth, docsbotCommon } from '../common';

export const findBot = createAction({
  auth: docsbotAuth,
  name: 'findBot',
  displayName: 'Find Bot',
  description: 'Finds bot by name.',
  audience: 'both',
  aiMetadata: { description: 'Look up bots in a team by name, matching case-insensitively on any bot whose name contains the given string (returns all matches). Use this to resolve a bot name to its id before calling actions that require a botId. Read-only lookup, so it is idempotent; throws if no bot matches.', idempotent: true },
  props: docsbotCommon.findBotProperties(),
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, docsbotCommon.findBotSchema);

    const { teamId, name } = propsValue;
    const teamBots = await docsbotCommon.listBots({
      apiKey,
      teamId,
    });
    const needle = (name ?? '').trim().toLowerCase();
    // Try to find case-insensitive and partial match
    const bot = teamBots.filter((bot) =>
      (bot.name ?? '').toLowerCase().includes(needle)
    );

    if (bot.length === 0) {
      throw new Error(
        `No bot found with a name containing "${name}" in the selected team.`
      );
    }

    return bot;
  },
});
