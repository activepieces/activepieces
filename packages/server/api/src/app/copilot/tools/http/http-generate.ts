import { AskCopilotRequest } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { z } from 'zod'
import { GeminiModel } from './gemini-model'

import { processHttpRequest } from './http-agent'
import { AppSystemProp } from '../../../helper/system/system-prop'



export const httpGeneratorTool = {
    async generateHttpRequest(
        request: AskCopilotRequest,
    ): Promise<Record<string, unknown> | null> {
        const logger = system.globalLogger()
        try {
            const geminiModel = new GeminiModel(system.get(AppSystemProp.GEMINI_API_KEY) ?? '')


            const prompt = `As an API research expert, I need you to analyze and provide comprehensive details for integrating with: "${request.prompt}"

                Please conduct thorough research and provide exact implementation details focusing on:

                1. Complete API URL Structure:
                - Base URL and endpoint path
                - Required path parameters
                - Proper URL construction following REST conventions

                2. Authentication Requirements:
                - Authentication method (API key, OAuth, Basic Auth, etc.)
                - Where authentication should be placed (headers, query params, etc.)
                - Exact header names and formats
                - Any additional security headers needed

                3. Query Parameters:
                - Required and optional query parameters
                - Parameter names and expected values
                - Parameter formats and constraints
                - Default values if applicable

                4. Request Body Schema (for POST/PUT/PATCH):
                - Complete object structure
                - Required and optional fields
                - Data types and formats
                - Example payload

                5. Additional Considerations:
                - Rate limiting headers
                - Content-Type requirements
                - Response format specifications
                - Any special headers needed
                - Error handling considerations

                Please provide EXACT implementation details that a developer can use to properly integrate with this API.`

            const responseText = await geminiModel.chat(prompt, {
                temperature: 1,
                maxOutputTokens: 8192,
                topP: 0.95,
            })

            console.log(responseText)

            // Use OpenAI agent to parse Gemini's response
            const parsedResponse = await processHttpRequest(responseText)
            return parsedResponse
        }
        catch (error) {
            logger.error({
                step: 'error',
                error,
                prompt: request.prompt,
                stack: error instanceof Error ? error.stack : undefined,
                message: error instanceof Error ? error.message : 'Unknown error',
            }, '[generateHttpRequest] Failed to generate HTTP request')

            return getDefaultResponse()
        }
    },
}

function getDefaultResponse(): Record<string, unknown> {
    const response = {
        method: 'GET',
        url: '/api',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        queryParams: {},
        body: {},
        auth: {
            type: 'none' as const,
        },
    }

    system.globalLogger().info({
        step: 'default_response',
        response,
    }, '[generateHttpRequest] Returning default response')

    return response
}