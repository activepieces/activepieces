import { createAction, Property } from "@activepieces/pieces-framework";
import { tinyTalkAiAuth } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common"

export const askBotAction = createAction({
    name: 'ask-bot',
    auth: tinyTalkAiAuth,
    displayName: 'Ask Bot',
    description: 'Sends message to selected bot.',
    props: {
        botId: Property.ShortText({
            displayName: 'Bot ID',
            required: true,
            description: 'You can find this in your Bot Details page in the dashboard.'
        }),
        prompt: Property.LongText({
            displayName: 'Question',
            required: true
        })
    },
    async run(context) {
        const { botId, prompt } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.tinytalk.ai/v1/chat/completions',
            headers: {
                'Api-Key': context.auth.secret_text
            },
            body: {
                botId,
                messages: [
                   
                    {
                        "role": "assistant",
                        "content": "Hello, how can I help you?"
                    },
                     {
                        "role": "user",
                        "content": prompt
                    },
                ]
            }
        })

        return response.body;
    }
})