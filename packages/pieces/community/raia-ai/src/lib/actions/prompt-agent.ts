import { createAction, Property } from "@activepieces/pieces-framework";
import { raiaAiAuth } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const promptAgentAction = createAction({
    name: 'prompt-agent',
    displayName: 'Prompt Agent',
    description: 'Sends a prompt to a Raia Agent.',
    auth: raiaAiAuth,
    props: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            required: true
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: BASE_URL + '/prompts',
            headers: {
                'Agent-Secret-Key': context.auth.secret_text,
                'Content-Type': 'application/json'
            },
            body: { prompt: context.propsValue.prompt }
        })

        return response.body
    }
})