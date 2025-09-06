import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
} from '@activepieces/pieces-common';
import { docsbotAuth } from '../../index';
import { docsbotCommon } from '../common';

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
        history: Property.Json({
            displayName: 'History',
            description: 'An array of previous questions and answers to provide context. e.g., [{"question": "Hello", "answer": "Hi, how can I help?"}]',
            required: false,
            defaultValue: []
        }),
        full_source: Property.Checkbox({
            displayName: 'Full Source',
            description: 'If true, the full content of the answer source is returned.',
            required: false,
        }),
        format: Property.StaticDropdown({
            displayName: 'Format',
            description: "How to format the answer.",
            required: false,
            options: {
                options: [
                    { label: 'Markdown', value: 'markdown' },
                    { label: 'Text', value: 'text' },
                ]
            }
        }),
        metadata: Property.Json({
            displayName: 'Metadata',
            description: 'A JSON object with arbitrary metadata about the user (e.g., name, email).',
            required: false,
        }),
        testing: Property.Checkbox({
            displayName: 'Testing',
            description: 'If true, question logs will be marked as being from staff.',
            required: false,
        }),
        context_items: Property.Number({
            displayName: 'Context Items',
            description: 'Number of sources to look up for the bot to answer from. Default is 5.',
            required: false,
        }),
        autocut: Property.Number({
            displayName: 'Autocut',
            description: 'Autocut results to a specific number of groups. Set to 0 to disable.',
            required: false,
        }),
    },

    async run(context) {
        const { teamId, botId, ...bodyParams } = context.propsValue;

        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url: `https://api.docsbot.ai/teams/${teamId}/bots/${botId}/chat`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: bodyParams,
        };

        const res = await httpClient.sendRequest(request);

        return res.body;
    },
});

