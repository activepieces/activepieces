import OpenAI from 'openai'
import {
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from 'openai/resources'
import { CopilotInstanceTypes, logger, system, SystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, OpenAIRole } from '@activepieces/shared'

type GenerateCodeParams = {
    prompt: string
}

type generateHttpRequestDetailsParams = {
    prompt: string
    docsText?: string
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

export const copilotService = {
    async generateCode({ prompt }: GenerateCodeParams): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateCode] Prompting...')
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                ...this.createCodeMessageContext(),
                {
                    role: OpenAIRole.USER,
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

    createCodeMessageContext(): ChatCompletionMessageParam[] {
        return [
            {
                role: OpenAIRole.USER,
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
                role: OpenAIRole.USER,
                content:
                    'I want code that will combine 2 arrays and only return the unique elements',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const combinedArray = [...inputs.array1, ...inputs.array2]***NEW_LINE***  const uniqueArray = Array.from(new Set(combinedArray))***NEW_LINE***  return uniqueArray***NEW_LINE***};", "inputs": [ { "key": "array1", "value": "[1,2,3]" }, { "key": "array2", "value": "[4,5,6]" } ], "packages": [] }',
                },
            },
            {
                role: OpenAIRole.USER,
                content:
                    'Write me a piece of code that splits the user\'s first name from his last name in a full name string received in inputs.',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const nameParts = inputs.fullName.split(\' \')***NEW_LINE***  const firstName = nameParts[0]***NEW_LINE***  const lastName = nameParts.slice(1).join(\'\')***NEW_LINE***  return { firstName, lastName }***NEW_LINE***};", "inputs": [ { "key": "fullName","value": "John Doe" } ], "packages": [] }',
                },
            },
            {
                role: OpenAIRole.USER,
                content:
                    'from an array of objects, take the created_at property for each object and print it as an ISO string',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const isoStrings = inputs.array.map(obj => new Date(obj.created_at).toISOString())***NEW_LINE***  return isoStrings;***NEW_LINE***};", "inputs": [ { "key": "array","value": "[{ "created_at": "2022-01-14T12:34:56Z" }, { "created_at": "2022-01-15T09:45:30Z" } ]" } ], "packages": [] }',
                },
            },
            {
                role: OpenAIRole.USER,
                content: 'Hi',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'Hi\'***NEW_LINE***};", "inputs": [], "packages": [] }',
                },
            },
            {
                role: OpenAIRole.USER,
                content: 'How are you?',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'How are you?\'***NEW_LINE***};", "inputs": [], "packages": [] }',
                },
            },
            {
                role: OpenAIRole.USER,
                content:
                    'Using axios, send a GET request to https://cloud.activepieces.com/api/v1/pieces',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "import axios from \'axios\'***NEW_LINE***export const code = async (inputs) => {***NEW_LINE***  const response = await axios.get(\'https://cloud.activepieces.com/api/v1/pieces\');***NEW_LINE***  return response.data;***NEW_LINE***};", "inputs": [], "packages": ["axios"] }',
                },
            },
        ]
    },

    async generateHttpRequestDetails({ prompt, docsText }: generateHttpRequestDetailsParams ): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateHttpRequestDetails] Prompting...')
        const content = docsText ? `${prompt} Use the following docs: ${docsText}` : prompt
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                ...this.createHttpRequestDetailsMessageContext(),
                {
                    role: OpenAIRole.USER,
                    content,
                },
            ],
            tools: this.generateHttpRequestDetailsTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'generate_http_request_details',
                },
            },
            temperature: 1,
        })
        assertNotNullOrUndefined(
            result.choices[0].message.tool_calls,
            'generateHttpRequestDetails',
        )
        logger.debug(
            { response: result.choices[0].message.tool_calls[0] },
            '[CopilotService#generateHttpRequestDetails] Response received...',
        )
        return result.choices[0].message.tool_calls[0].function.arguments
    },

    createHttpRequestDetailsMessageContext(): ChatCompletionMessageParam[] {
        return [
            {
                role: OpenAIRole.USER,
                content: 
                `# INTRODUCTION
                You are a bot that helps users turn prompts which can include curl requests into details of http API requests.
        
                # RESPONSE FORMAT
                You will not respond to any messages that require a conversational answer.
                You will not elaborate.
                You MUST respond ONLY with a json object containing the url of type string, a method which is a string that can only be one of the following: GET, POST, PUT, PATCH, DELETE. and headers object containing key-value pairs of strings, queryParams object containing key-value pairs of strings, and a body object containing key-value pairs of strings, and a body_type string which can only be one of the following: json, form_data raw. You will follow this format with the same names and types.
                The url and method are required and must always be included in the response, the body, queryParams, and body_type are optional and should be included only if they are required for the request to work.
                body_type is required if the body is included in the response.
                headers should be included only when needed, such as when an Authorization header is required.`,
            },
            {
                role: OpenAIRole.USER,
                content:
                    'I want to make a request to the Spotify API to get information about an artist. The artist ID is 0TnOYISbd1XYRBk9myaseg.',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_http_request_details',
                    arguments:
                        '{"url":"https://api.spotify.com/v1/artists/0TnOYISbd1XYRBk9myaseg","method":"GET","headers":{"Authorization":"Bearer your_token"}}',
                },
            },
            {
                role: OpenAIRole.USER,
                content:
                    'I want to make a request to the OpenWeatherMap API to get the current weather for a location with latitude 33.44 and longitude -94.04. I do not want the hourly and daily forecasts.',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_http_request_details',
                    arguments:
                        '{"url":"https://api.openweathermap.org/data/3.0/onecall","method":"GET","queryParams":{"lat":"33.44","lon":"-94.04","exclude":"hourly,daily","appid":"your_api_key"}}',
                },
            },
            {
                role: OpenAIRole.USER,
                content:
                    'I want to create a tweet using the Twitter API. The content of the tweet should be: "Just discovered a great new coffee shop in town ☕️ #coffee"',
            },
            {
                role: OpenAIRole.ASSISTANT,
                content: null,
                function_call: {
                    name: 'generate_http_request_details',
                    arguments:
                    '{"url":"https://api.twitter.com/2/tweets","method":"POST","headers":{"Authorization":"Bearer your_bearer_token"},"body":{"text":"Just discovered a great new coffee shop in town ☕️ #coffee"}}',
                },
            },
        ]
    },

    generateHttpRequestDetailsTools(): ChatCompletionTool[] {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'generate_http_request_details',
                    description: 'Write http API request details based on user prompt.',
                    parameters: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'The url of the API endpoint to make the request to.',
                            },
                            method: {
                                type: 'string',
                                description: 'The HTTP method to use for the request. Can be one of GET, POST, PUT, PATCH, DELETE.',
                            },
                            headers: {
                                type: 'object',
                                description: 'The headers to include in the request. Key-value pairs of strings.',
                            },
                            queryParams: {
                                type: 'object',
                                description: 'The query parameters to include in the request. Key-value pairs of strings.',
                            },
                            body: {
                                type: 'object',
                                description: 'The body to include in the request. Key-value pairs of strings.',
                            },
                            body_type: {
                                type: 'string',
                                description: 'The type of the body. Can be one of json, form_data, raw.',
                            },
                        },
                        required: ['url', 'method'],
                    },
                },
            },
        ]
        return tools as ChatCompletionTool[]
    },
}
