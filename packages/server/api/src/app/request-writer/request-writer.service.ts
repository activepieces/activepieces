import { AppSystemProp, CopilotInstanceTypes, system } from '@activepieces/server-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources'

type RequestWriteParams = {
    prompt: string
}


function getOpenAI(): OpenAI {
    let openai
    const apiKey = system.getOrThrow(AppSystemProp.OPENAI_API_KEY)
    const openaiInstanceType = system.getOrThrow<CopilotInstanceTypes>(AppSystemProp.COPILOT_INSTANCE_TYPE)

    switch (openaiInstanceType) {
        case CopilotInstanceTypes.AZURE_OPENAI: {
            const apiVersion = system.getOrThrow(AppSystemProp.AZURE_OPENAI_API_VERSION)
            openai = new OpenAI({
                apiKey,
                baseURL: system.getOrThrow(AppSystemProp.AZURE_OPENAI_ENDPOINT),
                defaultQuery: { 'api-version': apiVersion },
                defaultHeaders: { 'api-key': apiKey },
            })
            break
        }
        case CopilotInstanceTypes.OPENAI: {
            openai = new OpenAI({
                apiKey,
                baseURL: system.get(AppSystemProp.OPENAI_API_BASE_URL),
            })
            break
        }
    }
    return openai
}

export const requestWriterService = {
    async generateHttpRequest({ prompt }: RequestWriteParams): Promise<string> {
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            tools: this.createCodeTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'http_request',
                },
            },
            temperature: 0.2,
        })
        assertNotNullOrUndefined(
            result.choices[0].message.tool_calls,
            'OpenAICodeResponse',
        )
        return result.choices[0].message.tool_calls[0].function.arguments
    },

    createCodeTools(): ChatCompletionTool[] {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'http_request',
                    description: `Generates a JSON object from API documentation based on user prompt.
                    Make sure that the queryParams, body and headers are all valid JSON strings, if not needed, leave them empty.
                    `,
                    parameters: {
                        type: 'object',
                        properties: {
                            method: { type: 'string' },
                            url: { type: 'string' },
                            queryParams: { 
                                type: 'string',
                            },
                            body: { 
                                type: 'string',
                            },
                            headers: {
                                type: 'string',
                            },
                        },
                        required: ['method', 'url'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },
}