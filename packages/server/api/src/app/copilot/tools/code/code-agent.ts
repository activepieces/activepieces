import { exceptionHandler } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { selectIcon } from './icon-agent'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

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
        throw new Error('Failed to initialize OpenAI model')
    }
}

const codeGenerationSchema = z.object({
    code: z.string(),
    inputs: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        suggestedValue: z.string().optional(),
    })).default([]),
    title: z.string().optional(),
})

type CodeAgentResponse = {
    code: string
    inputs: Record<string, string>
    icon: string | undefined
    title: string
}

const defaultResponse: CodeAgentResponse = {
    code: '',
    inputs: {},
    icon: undefined,
    title: 'Custom Code',
}

const log = system.globalLogger()

export async function generateCode(
    requirement: string,
    conversationHistory: Message[] = [],
): Promise<CodeAgentResponse> {
    try {
        const model = getModel()
        if (!model) {
            return defaultResponse
        }

        log.debug({
            requirement,
            contextMessages: conversationHistory.length,
        }, '[generateCode] Processing code generation request')

        const lastCodeResponse = conversationHistory
            .reverse()
            .find(msg => 
                msg.role === 'assistant' && 
                msg.content.includes('export const code ='),
            )

        const systemPrompt = `
        You are a TypeScript code generation expert for automation flows.
        You are generating code for a single step in an automation flow, NOT a backend service.
        
        CONVERSATION HISTORY:
        ${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
        
        ${lastCodeResponse ? `PREVIOUS CODE TO ENHANCE (unless user requests something completely different):
        ${lastCodeResponse.content}
        ` : ''}

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
           - If the intended input is not a single string value like "Hello" put it inside {{  }}, like {{ 500 }} or {{ [1,2,3,4] }} or {{ ["apple", "banana", "orange"] }}  or {{ {"key": "value"} }} or {{ [{"key": "value1"}, {"key": "value2"} ] }} 
           
        4. Flow Integration:
           - Return data that next steps can use
           - Keep processing focused on one task
           - Don't try to handle multiple operations
           - Let the flow orchestrate complex processes

        5. Title:
           - Title should be 2-4 words, action-oriented
           - Examples: "Send Email", "Query Database", "Transform JSON"

        Perfect Example (Gmail API Usage):
        {
            "code": "export const code = async (inputs: { accessToken: string }) => {\\n  try {\\n    const auth = new google.auth.OAuth2();\\n    auth.setCredentials({ access_token: inputs.accessToken });\\n\\n    const gmail = google.gmail({ version: 'v1', auth });\\n    const response = await gmail.users.messages.list({\\n      userId: 'me',\\n      maxResults: 10\\n    });\\n\\n    return { messages: response.data.messages || [] };\\n  } catch (error) {\\n    throw new Error(\`Gmail API error: \${error.message}\`);\\n  }\\n}",
            "inputs": [
                {
                    "name": "accessToken",
                    "description": "Gmail API access token",
                    "suggestedValue": "Your Gmail API access token"
                }
            ],
            "title": "List Gmail Messages"
        }

        IMPORTANT REMINDERS:
        - This is ONE STEP in a flow
        - Previous steps provide inputs
        - Next steps use outputs
        - Keep it focused on one operation
        - Let the flow handle complex workflows
        - Authentication comes from flow connections
        - Return useful data for next steps
        - If the user requests enhancements, modify the previous code unless they explicitly ask for something different`

        const llmResponse = await generateObject({
            model,
            system: systemPrompt,
            schema: codeGenerationSchema,
            prompt: `Generate TypeScript code for this automation flow requirement: ${requirement}`,
            temperature: 0,
        })

        log.debug({
            requirement,
            conversationHistory,
            previousCode: lastCodeResponse?.content,
            generatedCode: llmResponse?.object?.code,
        }, '[generateCode] Code generation response')


        if (isNil(llmResponse?.object)) {
            return defaultResponse
        }

        const resultInputs = llmResponse?.object?.inputs?.reduce((acc, input) => {
            acc[input.name] = input.suggestedValue ?? ''
            return acc
        }, {} as Record<string, string>) ?? {}


        const icon = await selectIcon(requirement, conversationHistory)

        return {
            code: llmResponse.object.code,
            inputs: resultInputs,
            icon: icon ?? undefined,
            title: llmResponse.object.title ?? defaultResponse.title,
        }
    }
    catch (error) {
        exceptionHandler.handle(error, system.globalLogger())
        return defaultResponse
    }
}
