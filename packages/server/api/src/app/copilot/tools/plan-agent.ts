import { createOpenAI } from '@ai-sdk/openai'
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
            return {}
        }

        const systemPrompt = `
        You are an expert planning agent for Node.js backend development.
        Your role is to analyze requirements and create detailed implementation plans.

        CRITICAL RESPONSIBILITIES:
        1. Carefully analyze user requirements - pay attention to every detail
        2. Determine if research is needed for unfamiliar technologies/APIs
        3. Create detailed implementation steps
        4. Provide comprehensive context for code generation
        5. Suggest appropriate Lucide icon and title
        6. Consider package requirements based on sandbox mode

        CONTEXT GENERATION RULES:
        - The context field is CRITICAL - it must contain detailed instructions for code generation
        - Include all necessary implementation details
        - Specify exact requirements for inputs and their types
        - Mention error handling requirements
        - Include any specific patterns or approaches to use
        - If research results are provided, incorporate relevant implementation details

        Environment Context:
        - Node.js backend only (no frontend)
        - Sandbox/serverless environment
        - ${sandboxMode ? 'Can use external packages' : 'Must use only Node.js native features'}

        Planning Guidelines:
        - Break down complex tasks into clear, actionable steps
        - Consider error handling and security implications
        - Plan for proper input validation and type safety
        - Consider performance and resource constraints
        - Be explicit about package requirements
        - Include specific error scenarios to handle

        For the suggestedIcon, use Lucide icon names (https://lucide.dev/icons/):
        - For HTTP/API: 'Globe', 'Network', 'Cloud'
        - For files: 'File', 'FileText', 'Files'
        - For email: 'Mail', 'SendHorizontal'
        - For database: 'Database', 'Storage'
        - For authentication: 'Lock', 'Shield'
        - For data processing: 'Code2', 'Terminal'
        - For messaging: 'MessageSquare', 'MessagesSquare'
        - For scheduling: 'Calendar', 'Clock'
        - Default: 'Code2'

        Example Response for Email Sending:
        {
            "needsResearch": true,
            "searchQueries": [
                {
                    "query": "Node.js native email sending capabilities vs nodemailer implementation",
                    "reason": "Need to understand best email sending approach"
                }
            ],
            "plan": [
                {
                    "step": 1,
                    "action": "Setup email configuration",
                    "details": "Define email server settings and authentication"
                },
                {
                    "step": 2,
                    "action": "Implement email sending function",
                    "details": "Create function with proper error handling and validation"
                }
            ],
            "readyForCode": false,
            "context": "Create a TypeScript function that sends emails with the following requirements:
            - Accept recipient, subject, and body as inputs
            - Validate email format
            - Handle connection errors
            - Include timeout handling
            - Return success/failure status
            - Use proper TypeScript types for all inputs
            - Include retry logic for failed attempts",
            "requiresPackages": true,
            "suggestedIcon": "Mail",
            "suggestedTitle": "Email Dispatch System"
        }

        Example Response for Data Processing:
        {
            "needsResearch": false,
            "searchQueries": [],
            "plan": [
                {
                    "step": 1,
                    "action": "Implement data transformation",
                    "details": "Create function to process and validate input data"
                }
            ],
            "readyForCode": true,
            "context": "Create a TypeScript function that processes data with these requirements:
            - Accept array of strings as input
            - Validate input array (non-empty, valid strings)
            - Transform each string to uppercase
            - Remove duplicates
            - Handle empty or invalid inputs
            - Return processed array
            - Include proper error messages
            - Use TypeScript array types",
            "requiresPackages": false,
            "suggestedIcon": "Code2",
            "suggestedTitle": "Data Transformation Pipeline"
        }
        `

        const prompt = searchResults 
            ? `
                Original requirement: ${requirement}

                Search results: ${searchResults}

                Based on these results, create a detailed plan that:
                1. Incorporates the research findings
                2. Provides specific implementation details
                3. Includes comprehensive context for code generation
                4. Considers ${sandboxMode ? 'available packages' : 'only Node.js native features'}
                5. Addresses all aspects of the original requirement
            `
            : `
                Analyze this requirement in detail: ${requirement}

                Create a comprehensive plan that:
                1. Addresses every aspect of the requirement
                2. Provides specific implementation details
                3. Includes detailed context for code generation
                4. Considers ${sandboxMode ? 'available packages' : 'only Node.js native features'}
                5. Accounts for error handling and edge cases
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

    
        if (result.object.readyForCode && (!result.object.context || result.object.context.trim() === '')) {
            result.object.context = `Create a TypeScript function that implements the following requirements:
                ${requirement}
                
                Include:
                - Proper error handling
                - Input validation
                - Type safety
                - Comprehensive error messages
                ${sandboxMode ? '' : '- Use only Node.js native features'}
            `
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
        readyForCode: false,
        context: '',
        requiresPackages: false,
        suggestedIcon: 'Code2',
        suggestedTitle: 'Code Implementation',
    }
} 