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

const httpRequestSchema = z.object({
    method: z.string().default('GET'),
    url: z.string(),
    headers: z.record(z.string()).default({}),
    queryParams: z.record(z.string()).optional().default({}),
    body: z.record(z.unknown()).optional().default({}),
})

export async function processHttpRequest(
    perplexityResponse: string,
): Promise<DeepPartial<typeof httpRequestSchema>> {
    if (!perplexityResponse) {
        return {}
    }

    try {
        const model = getModel()
        if (!model) {
            return {}
        }

        const result = await generateObject({
            model,
            system: `
            You are a data transformation expert. Your task is to take the provided HTTP request JSON 
            and ensure it matches our schema format. Always include all required fields (method, url, headers).
            If headers are missing, provide an empty object for headers.
            Example format:
            {
                "method": "POST",
                "url": "https://api.example.com/endpoint",
                "headers": {
                    "Content-Type": "application/json"
                },
                "queryParams": {},
                "body": {}
            }
            `,
            schema: httpRequestSchema,
            prompt: `
            Transform this HTTP request JSON to match our schema, ensuring all required fields are present:
            ${perplexityResponse}
            `,
        })

        if (!result?.object) {
            return {
                method: 'GET',
                url: '',
                headers: {},
                queryParams: {},
                body: {},
            }
        }

        // Ensure required fields exist
        const processedResult = {
            ...result.object,
            headers: result.object.headers || {},
            queryParams: result.object.queryParams || {},
            body: result.object.body || {},
        }

        return processedResult
    }
    catch (error) {
        return {
            method: 'GET',
            url: '',
            headers: {},
            queryParams: {},
            body: {},
        }
    }
}
