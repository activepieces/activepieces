import { createOpenAI } from '@ai-sdk/openai'
import { DeepPartial, generateObject } from 'ai'
import { z } from 'zod'
import { system, AppSystemProp } from '@activepieces/server-shared'

export function getModel() {
    try {
        const apiKey = system.get(AppSystemProp.OPENAI_API_KEY)
        if (!apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        const openai = createOpenAI({
            apiKey,
        })
        return openai.chat('gpt-4o')
    }
    catch (error) {
        console.error('Failed to initialize OpenAI model:', error)
        throw new Error('Failed to initialize OpenAI model')
    }
}

const codeGenerationSchema = z.object({
    code: z.string(),
    inputs: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
        suggestedValue: z.string().optional(),
    })).default([]),
})

export async function generateCode(
    requirement: string,
): Promise<DeepPartial<typeof codeGenerationSchema>> {
    try {
        const model = getModel()
        if (!model) {
            return {}
        }

        const systemPrompt = `
        You are a TypeScript code generation expert for automation flows.
        You are generating code for a single step in an automation flow, NOT a backend service.
        
        FLOW CONTEXT:
        - This code will run as one step in a larger flow
        - Previous steps provide inputs
        - Next steps will use the outputs
        - Authentication is handled by flow connections
        - Each step should do ONE thing well
        - Keep it simple and focused

        CRITICAL REQUIREMENTS:
        1. Function Requirements:
           - MUST start with 'export const code ='
           - MUST be an async function
           - MUST have proper input parameters
           - MUST return a value for next steps
           - Keep it simple - this is one step in a flow!
           - Focus on a single operation

        2. HTTP Requests:
           - Use native fetch API
           - NO external HTTP libraries needed
           - Simple error handling for responses
           - Always check response.ok

        3. Input Parameters:
           - Inputs come from previous steps or flow connections
           - Expect tokens/credentials from flow connections
           - NO OAuth flows or token generation
           - NO client IDs or secrets
           - NO redirect URLs
           - NO environment variables

        4. Flow Integration:
           - Return data that next steps can use
           - Keep processing focused on one task
           - Don't try to handle multiple operations
           - Let the flow orchestrate complex processes

        Perfect Example (Gmail API Usage):
        {
            "code": "export const code = async (inputs: { accessToken: string }) => {\\n  try {\\n    const auth = new google.auth.OAuth2();\\n    auth.setCredentials({ access_token: inputs.accessToken });\\n\\n    const gmail = google.gmail({ version: 'v1', auth });\\n    const response = await gmail.users.messages.list({\\n      userId: 'me',\\n      maxResults: 10\\n    });\\n\\n    return { messages: response.data.messages || [] };\\n  } catch (error) {\\n    throw new Error(\`Gmail API error: \${error.message}\`);\\n  }\\n}",
            "inputs": [
                {
                    "name": "accessToken",
                    "type": "string",
                    "description": "Gmail API access token",
                    "suggestedValue": "{{ connections.gmail.accessToken }}"
                }
            ]
        }

        IMPORTANT REMINDERS:
        - This is ONE STEP in a flow
        - Previous steps provide inputs
        - Next steps use outputs
        - Keep it focused on one operation
        - Let the flow handle complex workflows
        - Authentication comes from flow connections
        - Return useful data for next steps`

        const result = await generateObject({
            model,
            system: systemPrompt,
            schema: codeGenerationSchema,
            prompt: `Generate TypeScript code for this automation flow requirement: ${requirement}`,
            temperature: 0,
        })

        if (!result?.object) {
            return {
                code: '',
                inputs: [],
            }
        }

        return result.object
    }
    catch (error) {
        console.error('Code generation failed:', error)
        return {
            code: '',
            inputs: [],
        }
    }
}
