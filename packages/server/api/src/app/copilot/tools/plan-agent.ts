import { DeepPartial, generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from './code-agent'

const planSchema = z.object({
    needsResearch: z.boolean(),
    searchQueries: z.array(z.object({
        query: z.string(),
        reason: z.string(),
    })).default([]),
    plan: z.array(z.object({
        step: z.number(),
        action: z.string(),
        details: z.string(),
    })),
    readyForCode: z.boolean(),
    context: z.string(),
    requiresPackages: z.boolean(),
    suggestedIcon: z.string(),
    suggestedTitle: z.string(),
})

export type PlanResponse = z.infer<typeof planSchema>

export async function generatePlan(
    requirement: string,
    sandboxMode: boolean,
    searchResults?: string,
): Promise<DeepPartial<PlanResponse>> {
    try {
        const model = getModel()
        if (!model) {
            return getDefaultResponse()
        }

        const systemPrompt = `
        You are an expert planning agent for Node.js backend development.
        Your primary role is to analyze requirements and determine if API documentation research is needed.

        CRITICAL RESPONSIBILITIES:
        1. For services (Gmail, Slack, etc.):
           - ALWAYS check official REST API documentation first
           - Focus on API endpoints, authentication, and request formats
           - Search for direct REST API implementation methods
           - Only suggest libraries if REST API is too complex or not available

        2. For general tasks (data processing, file handling):
           - If it's a standard Node.js operation, proceed directly to code generation
           - Set readyForCode to true and provide detailed context
           - No research needed for basic operations

        3. After receiving search results:
           - ALWAYS set readyForCode to true
           - Provide comprehensive context for code generation
           - Include all necessary implementation details from the research

        CONTEXT GENERATION RULES:
        When setting context, include:
        1. Specific API endpoints to use
        2. Authentication method details
        3. Required request/response formats
        4. Error handling requirements
        5. Input parameter requirements
        6. Expected response format
        7. Any rate limiting considerations

        Example Response (Initial Research Needed):
        {
            "needsResearch": true,
            "searchQueries": [
                {
                    "query": "Gmail API REST documentation send email endpoint authentication",
                    "reason": "Need official Gmail API endpoints and authentication requirements"
                }
            ],
            "plan": [
                {
                    "step": 1,
                    "action": "Research API endpoints",
                    "details": "Identify correct Gmail API endpoint for sending emails"
                }
            ],
            "readyForCode": false,
            "context": "",
            "requiresPackages": false,
            "suggestedIcon": "Mail",
            "suggestedTitle": "Gmail Message Dispatcher"
        }

        Example Response (After Research or Simple Task):
        {
            "needsResearch": false,
            "searchQueries": [],
            "plan": [
                {
                    "step": 1,
                    "action": "Implement email sending",
                    "details": "Use Gmail API v1/users.messages.send endpoint"
                }
            ],
            "readyForCode": true,
            "context": "Create an async function that sends emails using Gmail API with these requirements:
            - Use POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
            - Accept recipient, subject, body as inputs
            - Handle rate limiting (quota: 100 requests/minute)
            - Include error handling for API responses
            - Return message ID and thread ID in response",
            "requiresPackages": true,
            "suggestedIcon": "Mail",
            "suggestedTitle": "Gmail Message Dispatcher"
        }

        Example Response (Simple Task, No Research):
        {
            "needsResearch": false,
            "searchQueries": [],
            "plan": [
                {
                    "step": 1,
                    "action": "Implement data transformation",
                    "details": "Process array of strings using native methods"
                }
            ],
            "readyForCode": true,
            "context": "Create an async function that processes an array of strings with these requirements:
            - Accept array of strings as input
            - Convert each string to uppercase
            - Remove duplicates
            - Return processed array and count
            - Include input validation
            - Handle empty arrays and invalid inputs",
            "requiresPackages": false,
            "suggestedIcon": "Code2",
            "suggestedTitle": "String Array Processor"
        }`

        const prompt = searchResults 
            ? `
                Original requirement: ${requirement}
                API Documentation results: ${searchResults}
                
                Based on these API docs, create a detailed implementation plan.
                IMPORTANT: You MUST now set readyForCode to true and provide comprehensive context for code generation.
                
                Include in context:
                1. Specific endpoints and methods to use
                2. Authentication requirements
                3. Request/response formats
                4. Error handling needs
                5. Input parameter requirements
                6. ${sandboxMode ? 'Required packages' : 'Native implementation approach'}
            `
            : `
                Analyze this requirement: ${requirement}

                If this is a simple task (data processing, string manipulation, etc.):
                - Set readyForCode to true
                - Provide detailed context
                - No research needed

                If this requires API knowledge:
                - Set needsResearch to true
                - Request specific API documentation
                - Focus on endpoints and authentication
            `

        const result = await generateObject({
            model,
            system: systemPrompt,
            schema: planSchema,
            prompt,
            temperature: 0,
        })

        if (!result.object) {
            return getDefaultResponse()
        }

        // If we have search results, ensure we're ready for code
        if (searchResults) {
            result.object.readyForCode = true
            if (!result.object.context || result.object.context.trim() === '') {
                result.object.context = `Create a TypeScript function that implements:
                    ${requirement}
                    
                    Using the following API documentation:
                    ${searchResults}
                    
                    Include:
                    - Proper error handling
                    - Input validation
                    - Type safety
                    - API response handling
                    ${sandboxMode ? '' : '- Use only Node.js native features'}
                `
            }
        }

        return result.object
    }
    catch (error) {
        console.error('Plan generation failed:', error)
        return getDefaultResponse()
    }
}

function getDefaultResponse(): DeepPartial<PlanResponse> {
    return {
        needsResearch: false,
        searchQueries: [],
        plan: [],
        readyForCode: true,
        context: 'Create a TypeScript function that implements the basic functionality with proper error handling and input validation.',
        requiresPackages: false,
        suggestedIcon: 'Code2',
        suggestedTitle: 'Code Implementation',
    }
} 