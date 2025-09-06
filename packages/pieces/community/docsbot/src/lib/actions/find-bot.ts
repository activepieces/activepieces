import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
} from '@activepieces/pieces-common';
import { docsbotAuth } from '../../index';
import { docsbotCommon } from '../common';

export const findBot = createAction({
    auth: docsbotAuth,
    name: 'find_bot',
    description: 'Finds a bot by its name.',
    displayName: 'Find Bot',
    props: {
        teamId: docsbotCommon.teamId,
        name: Property.ShortText({
            displayName: 'Bot Name',
            description: 'The exact name of the bot to find.',
            required: true,
        }),
        failOnNotFound: Property.Checkbox({
            displayName: "Fail if Bot Not Found",
            description: "If checked, the action will fail if no bot is found. If unchecked, it will return null.",
            required: false,
            defaultValue: false,
        })
    },

    async run(context) {
        const { teamId, name, failOnNotFound } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://docsbot.ai/api/teams/${teamId}/bots`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
            },
        };

        const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);
        
        const bot = response.body.find(b => b.name === name);

        if (!bot) {
            if (failOnNotFound) {
                throw new Error(`Bot with name "${name}" not found in the selected team.`);
            }
            return null;
        }

        return bot;
    },
});
