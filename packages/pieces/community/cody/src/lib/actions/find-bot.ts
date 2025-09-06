import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const findBotAction = createAction({
  auth: codyAuth,
  name: 'findBot',
  displayName: 'Find Bot',
  description: 'Finds a bot based on name.',
  props: {
    name: Property.ShortText({
      displayName: 'Bot Name',
      description: 'The name (or partial name) of the bot to search for. When exact match is disabled, this will use server-side filtering for better performance.',
      required: true,
    }),
    exactMatch: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'Enable exact name matching. When disabled, partial matches are allowed and server-side filtering is used for better performance.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { name, exactMatch } = context.propsValue;
    
    if (!name || name.trim() === '') {
      throw new Error('Bot name is required and cannot be empty');
    }
    
    const client = new CodyClient(context.auth);
    
    try {
      const response = exactMatch 
        ? await client.getBots()
        : await client.getBots(name);
      
      if (!response.success || !response.data) {
        throw new Error(`Failed to retrieve bots: ${response.error}`);
      }
      
      let foundBot = null;
      
      if (exactMatch) {
        foundBot = response.data.find(bot => 
          bot.name.toLowerCase() === name.toLowerCase()
        );
      } else {
        foundBot = response.data.length > 0 ? response.data[0] : null;
        if (!foundBot) {
          foundBot = response.data.find(bot => 
            bot.name.toLowerCase().includes(name.toLowerCase())
          );
        }
      }
      
      if (!foundBot) {
        return {
          success: true,
          bot: null,
          found: false,
          message: `No bot found with name "${name}"${exactMatch ? ' (exact match)' : ' (partial match)'}`,
          searchCriteria: {
            searchTerm: name,
            exactMatch,
            totalBotsSearched: response.data.length,
            searchMethod: exactMatch ? 'client-side-exact' : 'server-side-keyword',
          },
          pagination: response.meta?.pagination || null,
        };
      }
      
      return {
        success: true,
        bot: foundBot,
        found: true,
        message: `Bot "${foundBot.name}" found successfully`,
        searchCriteria: {
          searchTerm: name,
          exactMatch,
          totalBotsSearched: response.data.length,
          searchMethod: exactMatch ? 'client-side-exact' : 'server-side-keyword',
        },
        metadata: {
          botId: foundBot.id,
          botName: foundBot.name,
          createdAt: foundBot.created_at,
        },
        pagination: response.meta?.pagination || null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to find bot: ${errorMessage}`);
    }
  },
});
