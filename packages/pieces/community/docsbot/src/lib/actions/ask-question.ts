import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
} from '@activepieces/pieces-common';
import { docsbotAuth } from '../../index';
import { docsbotCommon } from '../common/common';

export const askQuestion = createAction({
    auth: docsbotAuth,
    name: 'ask_question',
    description: 'Ask a question to a specific bot in a specific team.',
    displayName: 'Ask Question',
    props: {
        teamId: docsbotCommon.teamId,
        botId: docsbotCommon.botId,
        question: Property.LongText({
            displayName: 'Question',
            description: 'The question you want to ask the bot.',
            required: true,
        }),
        full_source: Property.Checkbox({
            displayName: 'Full Source',
            description: 'If true, the full source of the answer is returned.',
            required: false,
        }),
        history: Property.Json({
            displayName: 'History',
            description: 'An array of previous questions and answers to provide context. e.g., [{"question": "Hello", "answer": "Hi, how can I help?"}]',
            required: false,
            defaultValue: []
        }),
    },

    async run(context) {
        const { teamId, botId, question, full_source, history } = context.propsValue;

        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/chat`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: {
                question,
                full_source,
                history,
            },
        };

        const res = await httpClient.sendRequest(request);

        return res.body;
    },
});
