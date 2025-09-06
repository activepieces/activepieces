import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const findBotAction = createAction({
    auth: codyAuth,
    name: 'find_bot',
    displayName: 'Find Bot',
    description: 'Finds a bot based on its name.',
    props: {
        name: Property.ShortText({
            displayName: 'Bot Name',
            description: 'The name of the bot to search for. The search is case-insensitive and partial.',
            required: true,
        })
    },
    async run(context) {
        const { name } = context.propsValue;
        const apiKey = context.auth;

        const bots = await codyClient.listBots(apiKey, name);
        
        // The API returns an array of matching bots.
        // We will return the full array to the user.
        return {
            found: bots.length > 0,
            bots: bots,
        };
    },
});