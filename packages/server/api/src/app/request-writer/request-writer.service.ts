import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources'
import { CopilotInstanceTypes, logger, system, SystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'

type RequestWriteParams = {
    prompt: string
}


function getOpenAI(): OpenAI {
    let openai
    const apiKey = system.getOrThrow(SystemProp.OPENAI_API_KEY)
    const openaiInstanceType = system.getOrThrow<CopilotInstanceTypes>(SystemProp.COPILOT_INSTANCE_TYPE)

    switch (openaiInstanceType) {
        case CopilotInstanceTypes.AZURE_OPENAI: {
            const apiVersion = system.getOrThrow(SystemProp.AZURE_OPENAI_API_VERSION)
            openai = new OpenAI({
                apiKey,
                baseURL: system.getOrThrow(SystemProp.AZURE_OPENAI_ENDPOINT),
                defaultQuery: { 'api-version': apiVersion },
                defaultHeaders: { 'api-key': apiKey },
            })
            break
        }
        case CopilotInstanceTypes.OPENAI: {
            openai = new OpenAI({
                apiKey,
                baseURL: system.get(SystemProp.OPENAI_API_BASE_URL),
            })
            break
        }
    }
    return openai
}

export const requestWriterService = {
    async generateCode({ prompt }: RequestWriteParams): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateCode] Prompting...')
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            tools: this.createCodeTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'fetch_api_details',
                },
            },
            temperature: 1,
        })
        assertNotNullOrUndefined(
            result.choices[0].message.tool_calls,
            'OpenAICodeResponse',
        )
        logger.debug(
            { response: result.choices[0].message.tool_calls[0] },
            '[CopilotService#generateCode] Response received...',
        )
        return result.choices[0].message.tool_calls[0].function.arguments
    },

    createCodeTools(): ChatCompletionTool[] {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'fetch_api_details',
                    description: 'Fetch API details from documentation of a service based on user prompt.',
                    parameters: {
                        type: 'object',
                        properties: {
                            method: {
                                type: 'string',
                                description: 'The HTTP method of the request either GET, POST, PUT, PATCH, DELETE',
                            },
                            url: { type: 'string', description: 'the endpoint of a service api' },
                            queryParams: { type: 'object', description: 'Query parameters required by the api' },
                            jsonBodySchema: { type: 'object', description: 'Body needed of the post, patch, and put request if provided in the service docs' },
                        },
                        required: ['method', 'url', 'queryParams', 'jsonBodySchema'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },
}
