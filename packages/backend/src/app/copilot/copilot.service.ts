import { assertNotNullOrUndefined } from '@activepieces/shared'
import { logger } from '../helper/logger'
import OpenAI from 'openai'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources'

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
                ...this.createCodeMessageContext(),
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
        assertNotNullOrUndefined(result.choices[0].message.tool_calls, 'OpenAICodeResponse')
        logger.debug({ response: result.choices[0].message.tool_calls[0] }, '[CopilotService#generateCode] Response received...')
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
                        },
                        required: ['code'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },

    createCodeMessageContext(): ChatCompletionMessageParam[] {
        return [
            {
                role: 'user',
                content: `
# INTRODUCTION
You are a TypeScript coding bot that helps users turn natural language into useable code, for an open-source automation platform called Activepieces.

# RESPONSE FORMAT
You will not respond to any messages that require a conversational answer.
You will not elaborate.
You will write the code in a single line, and add ***NEW_LINE*** at the end of every statement you write.
You MUST respond ONLY with a function call.
You will use import to import any libraries you need. You will be penalized for using require. You will be punished for using libraries that are not imported.
                `,
            },
            {
                role: 'user',
                content: 'I want code that will combine 2 arrays and only return the unique elements',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments: '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const combinedArray = [...inputs.array1, ...inputs.array2]***NEW_LINE***  const uniqueArray = Array.from(new Set(combinedArray))***NEW_LINE***  return uniqueArray***NEW_LINE***};", "inputs": [ { "key": "array1", "value": "[1,2,3]" }, { "key": "array2", "value": "[4,5,6]" } ] }',
                },
            },
            {
                role: 'user',
                content: 'Write me a piece of code that splits the user\'s first name from his last name in a full name string received in inputs.',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments: '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const nameParts = inputs.fullName.split(\' \')***NEW_LINE***  const firstName = nameParts[0]***NEW_LINE***  const lastName = nameParts.slice(1).join(\'\')***NEW_LINE***  return { firstName, lastName }***NEW_LINE***};", "inputs": [ { "key": "fullName","value": "John Doe" } ] }',
                },
            },
            {
                role: 'user',
                content: 'from an array of objects, take the created_at property for each object and print it as an ISO string',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    'name': 'generate_code',
                    'arguments': '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const isoStrings = inputs.array.map(obj => new Date(obj.created_at).toISOString())***NEW_LINE***  return isoStrings;***NEW_LINE***};", "inputs": [ { "key": "array","value": "[{ "created_at": "2022-01-14T12:34:56Z" }, { "created_at": "2022-01-15T09:45:30Z" } ]" } ] }',
                },
            },
            {
                role: 'user',
                content: 'Hi',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments: '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'Hi\'***NEW_LINE***};", "inputs": [] }',
                },
            },
            {
                role: 'user',
                content: 'How are you?',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments: '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'How are you?\'***NEW_LINE***};", "inputs": [] }',
                },
            },
            {
                role: 'user',
                content: 'Using axios, send a GET request to https://cloud.activepieces.com/api/v1/pieces',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments: '{ "code": "import axios from \'axios\'***NEW_LINE***export const code = async (inputs) => {***NEW_LINE***  const response = await axios.get(\'https://cloud.activepieces.com/api/v1/pieces\');***NEW_LINE***  return response.data;***NEW_LINE***};", "inputs": [] }',
                },
            },
        ]
    },
}
