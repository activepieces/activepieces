import { createOpenAI } from '@ai-sdk/openai'
import { DeepPartial, generateObject } from 'ai'
import { z } from 'zod'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'

export function getModel() {
    try {
        const openai = createOpenAI({
            apiKey: system.get(AppSystemProp.OPENAI_API_KEY),
        })
        return openai.chat('gpt-4o')
    }
    catch (error) {
        throw new Error('Failed to initialize OpenAI model')
    }
}

const authSchema = z.object({
    type: z.enum(['bearer', 'basic', 'api_key', 'oauth2', 'none'])
        .default('none')
        .describe('The type of authentication required. Bearer uses token-based auth, basic uses username/password, api_key uses a single key, oauth2 uses OAuth 2.0 flow.'),
    location: z.enum(['header', 'query', 'body'])
        .optional()
        .describe('Where the authentication credentials should be placed in the request. Headers are most common for API keys and bearer tokens.'),
    key: z.string()
        .optional()
        .describe('The name of the header, query parameter, or body field where the auth value should be placed (e.g., "Authorization" for bearer tokens, "X-API-Key" for API keys)'),
    value: z.string()
        .optional()
        .describe('The template or format of the auth value (e.g., "Bearer {token}" for bearer auth, "{api_key}" for API key)'),
    description: z.string()
        .optional()
        .describe('Human-readable description of the authentication requirements and how to obtain the necessary credentials'),
})

const httpRequestSchema = z.object({
    method: z.string()
        .default('GET')
        .describe('HTTP method to use for the request. Common methods are GET for retrieving data, POST for creating, PUT for updating, DELETE for removing.'),
    url: z.string()
        .describe('The complete URL for the request, including path parameters. May include template variables like {id} that need to be replaced.'),
    headers: z.record(z.string())
        .default({})
        .describe('HTTP headers to include in the request. Common headers include Content-Type, Accept, and Authorization.'),
    queryParams: z.record(z.string())
        .optional()
        .default({})
        .describe('Query parameters to append to the URL. These are key-value pairs that come after the ? in the URL.'),
    body: z.record(z.unknown())
        .optional()
        .default({})
        .describe('Request body for POST, PUT, PATCH requests. Should match the Content-Type header format.'),
    auth: authSchema
        .default({
            type: 'none',
        })
        .describe('Authentication configuration specifying how to authenticate the request.'),
    baseUrl: z.string()
        .optional()
        .describe('Base URL of the API, useful when the API has a common base URL with different endpoints.'),
    pathParams: z.record(z.string())
        .optional()
        .default({})
        .describe('Parameters to be replaced in the URL path. For example, if URL contains {id}, provide {"id": "123"}.'),
    contentType: z.string()
        .optional()
        .describe('Specific Content-Type header value. Common values are application/json, application/x-www-form-urlencoded, multipart/form-data.'),
    acceptType: z.string()
        .optional()
        .describe('Specific Accept header value indicating the expected response format. Common values are application/json, text/plain.'),
}).describe('HTTP request configuration with authentication support. Includes all necessary fields for making authenticated API requests.')

type HttpRequest = z.infer<typeof httpRequestSchema>

export async function processHttpRequest(
    searchResponse: string,
): Promise<DeepPartial<HttpRequest>> {
    if (!searchResponse) {
        return {}
    }

    try {
        const model = getModel()
        if (!model) {
            return {}
        }

        const result = await generateObject<HttpRequest>({
            model,
            system: `
            You are an API authentication expert. Your task is to analyze the provided HTTP request description
            and extract all authentication-related information and request details, ensuring it matches our schema format.
            
            CRITICAL REQUIREMENTS:
            1. Authentication Headers:
               - NEVER omit authentication headers mentioned in the description
               - ONLY include authentication headers that are explicitly mentioned in the description
               - Authentication details must be reflected in both 'headers' and 'auth' objects
               - Do not add any assumed or default authentication headers

            2. Query Parameters:
               - NEVER put query parameters in the URL
               - ALWAYS extract them to the queryParams object
               - For URLs like "endpoint?param1=value1&param2=value2", parse these into queryParams
               - Only include query parameters explicitly mentioned in the description

            3. URL Construction:
               - Base URL and endpoint path only in the url field
               - All query parameters must be in queryParams object
               - Remove query string from URL if present
               - Only use URLs and endpoints mentioned in the description

            4. Data Accuracy:
               - ONLY use information explicitly provided in the description
               - Do not make assumptions or add details not present in the description
               - If information is missing, leave the corresponding fields empty
               - Do not fill in default values unless specified in the description

            Example API Request:
            {
                "method": "GET",
                "url": "https://api.example.com/v1/resources",
                "headers": {
                    "Authorization": "Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                "queryParams": {
                    "limit": "100",
                    "offset": "0"
                },
                "auth": {
                    "type": "bearer",
                    "location": "header",
                    "key": "Authorization",
                    "value": "Bearer {token}",
                    "description": "Bearer token required for authentication"
                }
            }
            `,
            schema: httpRequestSchema,
            prompt: `
            Analyze this HTTP request description and extract ONLY the details that are explicitly mentioned, paying special attention to:
            1. Authentication requirements (API keys, tokens, where they go)
            2. Query parameters (both from URL examples and description)
            3. Required headers
            4. Base URL and endpoints
            5. Content type specifications

            IMPORTANT: 
            - Only include information that is explicitly provided in the description
            - Do not make assumptions or add details that are not present
            - If certain information is missing, leave those fields empty
            - Strictly follow the data structure from the schema

            Description:
            ${searchResponse}
            `,
        })

        if (!result?.object) {
            return {
                method: 'GET',
                url: '',
                headers: {},
                queryParams: {},
                body: {},
                auth: {
                    type: 'none',
                },
            }
        }

        return result.object
    }
    catch (error) {
        return {
            method: 'GET',
            url: '',
            headers: {},
            queryParams: {},
            body: {},
            auth: {
                type: 'none',
            },
        }
    }
}
