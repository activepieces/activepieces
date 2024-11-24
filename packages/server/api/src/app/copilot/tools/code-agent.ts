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
    packages: z.array(z.string()).default([]),
    inputs: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
        suggestedValue: z.string().optional(),
    })).default([]),
})

export async function generateCode(
    requirement: string,
    sandboxMode: boolean,
): Promise<DeepPartial<typeof codeGenerationSchema>> {
    try {
        const model = getModel()
        if (!model) {
            return {}
        }

        const systemPrompt = `
        You are a TypeScript code generation expert for automation flows.
        You are generating code for a SINGLE STEP in an automation flow, NOT a backend service.
        
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

        Perfect Examples:

        1. Simple API Request:
        {
            "code": "export const code = async (inputs: { url: string }) => {\\n  try {\\n    const response = await fetch(inputs.url);\\n    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\\n    return { data: await response.json() };\\n  } catch (error) {\\n    throw new Error(\`Request failed: \${error.message}\`);\\n  }\\n}",
            "packages": [],
            "inputs": [
                {
                    "name": "url",
                    "type": "string",
                    "description": "API endpoint URL",
                    "suggestedValue": "https://api.example.com/data"
                }
            ]
        }

        2. Authenticated API Request:
        {
            "code": "export const code = async (inputs: { url: string, apiKey: string }) => {\\n  try {\\n    const response = await fetch(inputs.url, {\\n      headers: { Authorization: \`Bearer \${inputs.apiKey}\` }\\n    });\\n    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\\n    return { data: await response.json() };\\n  } catch (error) {\\n    throw new Error(\`Request failed: \${error.message}\`);\\n  }\\n}",
            "packages": [],
            "inputs": [
                {
                    "name": "url",
                    "type": "string",
                    "description": "API endpoint URL",
                    "suggestedValue": "https://api.example.com/data"
                },
                {
                    "name": "apiKey",
                    "type": "string",
                    "description": "API key for authentication",
                    "suggestedValue": "{{ connections.service.apiKey }}"
                }
            ]
        }

        3. Data Processing:
        {
            "code": "export const code = async (inputs: { data: string[] }) => {\\n  try {\\n    const processed = inputs.data.map(item => item.toUpperCase());\\n    return {\\n      result: processed,\\n      count: processed.length\\n    };\\n  } catch (error) {\\n    throw new Error(\`Processing failed: \${error.message}\`);\\n  }\\n}",
            "packages": [],
            "inputs": [
                {
                    "name": "data",
                    "type": "string[]",
                    "description": "Array of strings to process",
                    "suggestedValue": "{{ ['item1', 'item2'] }}"
                }
            ]
        }

        BAD EXAMPLES (NEVER DO THESE):
        1. ❌ Using external HTTP libraries (Wrong):
           import axios from 'axios';
           -or-
           import { fetch } from 'node-fetch';
        ✅ Correct:
           Use native fetch

        2. ❌ OAuth Implementation (Wrong):
           const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
        ✅ Correct:
           const auth = new google.auth.OAuth2();
           auth.setCredentials({ access_token: inputs.accessToken });

        3. ❌ Environment Variables (Wrong):
           process.env.API_KEY
        ✅ Correct:
           inputs.apiKey

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
            prompt: `Generate TypeScript code for this automation flow requirement: ${requirement}
Remember: 
- ${sandboxMode ? 'External packages are allowed' : 'Use only Node.js native features'}
- Must return useful data for the next step
- Include proper error handling
- All inputs must have suggested values
- Use proper TypeScript types
- Use native fetch for HTTP requests`,
            temperature: 0,
        })

        if (!result?.object) {
            return {
                code: '',
                packages: [],
                inputs: [],
            }
        }

        return result.object
    }
    catch (error) {
        console.error('Code generation failed:', error)
        return {
            code: '',
            packages: [],
            inputs: [],
        }
    }
}
