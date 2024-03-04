import { assertNotNullOrUndefined } from '@activepieces/shared'
import { logger } from 'server-shared'
import OpenAI from 'openai'
import { system, SystemProp } from 'server-shared'
import {
    ChatCompletionTool,
} from 'openai/resources'
import { copilotContextService } from './copilot.context.service'

type GenerateCodeParams = {
    prompt: string
}

function getOpenAI(): OpenAI {
    return new OpenAI({
        apiKey: system.getOrThrow(SystemProp.OPENAI_API_KEY),
        baseURL: system.get(SystemProp.OPENAI_API_BASE_URL),
    })
}

export const copilotService = {
    async generateCode({ prompt }: GenerateCodeParams): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateCode] Prompting...')
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                ...copilotContextService.createCodeMessageContext(),
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            tools: this.createCodeTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'generate_code',
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
                    name: 'generate_code',
                    description: 'Write TypeScript code snippet based on user prompt.',
                    parameters: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'The code snippet to write.',
                            },
                            inputs: {
                                type: 'array',
                                description: 'The inputs used in the code snippet.',
                                items: {
                                    type: 'object',
                                    properties: {
                                        key: {
                                            type: 'string',
                                            description: 'The name of the input property.',
                                        },
                                        value: {
                                            type: 'string',
                                            description: 'The value to fill the property with.',
                                        },
                                    },
                                },
                            },
                            packages: {
                                type: 'array',
                                description: 'The packages imported in the code snippet',
                                items: {
                                    type: 'string',
                                    description:
                    'The name of the package, e.g axios, lodash, etc.',
                                },
                            },
                        },
                        required: ['code'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },

    async generateInputs({ prompt }: GenerateCodeParams): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateInputs] Prompting...')
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                ...copilotContextService.createInputMessageContext(),
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            tools: this.createInputTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'generate_inputs',
                },
            },
            temperature: 1,
        })
        assertNotNullOrUndefined(
            result.choices[0].message.tool_calls,
            'OpenAIInputResponse',
        )
        logger.debug(
            { response: result.choices[0].message.tool_calls[0] },
            '[CopilotService#generateInputs] Response received...',
        )
        return result.choices[0].message.tool_calls[0].function.arguments
    },

    createInputTools(): ChatCompletionTool[] {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'generate_inputs',
                    description: 'Fill the step inputs based on the flow data and user prompt.',
                    parameters: {
                        type: 'object',
                        properties: {
                            inputs: {
                                type: 'array',
                                description: 'The inputs used in the step.',
                                items: {
                                    type: 'object',
                                    properties: {
                                        step: {
                                            type: 'string',
                                            description: 'The name of the step.',
                                        },
                                        input: {
                                            type: 'object',
                                            description: 'An object containing key-value pairs of inputs to be filled.',
                                            properties: {
                                                key: {
                                                    type: 'string',
                                                    description: 'The name of the input property.',
                                                },
                                                value: {
                                                    type: 'string',
                                                    description: 'The value to fill the property with.',
                                                },
                                            },
                                            required: ['key', 'value'],
                                        },
                                    },
                                    required: ['step', 'input'],
                                },
                            },
                        },
                        required: ['inputs'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },
}
