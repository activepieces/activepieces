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
        You are an expert planning agent for Node.js automation flows.
        Your primary role is to analyze requirements for a SINGLE STEP in an automation flow.

        IMPORTANT CONTEXT:
        - This is for automation flow steps, NOT backend services
        - Each step is a single, focused operation
        - Steps receive inputs from previous steps
        - Steps provide outputs for next steps
        - Authentication tokens come from flow connections
        - No need to handle OAuth flows or token management

        RESEARCH STRATEGY:
        1. For API Services (Gmail, Slack, etc.):
           - ALWAYS check official REST API documentation first
           - Focus on specific API endpoint needed for this step
           - Prefer official SDK packages over REST if available
           - Keep implementation focused on one operation

        2. For general tasks:
           - If it's a standard operation, provide example pattern
           - Keep it simple - one task per step
           - Focus on input/output contract
           - Remember this is part of a larger flow

        CONTEXT GENERATION EXAMPLES:

        1. For REST API Calls:
        {
            "readyForCode": true,
            "context": "Create an async function that makes an API request.
            Reference implementation pattern:

            export const code = async (inputs: { apiKey: string; endpoint: string; }) => {\\n
              try {\\n
                const response = await fetch(inputs.endpoint, {\\n
                  headers: {\\n
                    'Authorization': \`Bearer \${inputs.apiKey}\`,\\n
                    'Content-Type': 'application/json'\\n
                  }\\n
                });\\n
                \\n
                if (!response.ok) {\\n
                  throw new Error(\`API request failed with status \${response.status}\`);\\n
                }\\n
                \\n
                const data = await response.json();\\n
                return { data, statusCode: response.status };\\n
              } catch (error) {\\n
                throw new Error(\`API request failed: \${error.message}\`);\\n
              }\\n
            };

            Key points:
            - Use native fetch
            - Handle API errors properly
            - Include status code checks
            - Return response data for next step",
            "requiresPackages": false,
            "suggestedIcon": "Globe",
            "suggestedTitle": "API Request Handler"
        }

        2. For Gmail API:
        {
            "readyForCode": true,
            "context": "Create an async function that fetches emails using Gmail API.
            Reference implementation pattern:

            import { google } from 'googleapis';\\n\\n
            export const code = async (inputs: { accessToken: string; }) => {\\n
              try {\\n
                const auth = new google.auth.OAuth2();\\n
                auth.setCredentials({ access_token: inputs.accessToken });\\n
                \\n
                const gmail = google.gmail({ version: 'v1', auth });\\n
                const response = await gmail.users.messages.list({\\n
                  userId: 'me',\\n
                  maxResults: 10\\n
                });\\n
                \\n
                return { messages: response.data.messages || [] };\\n
              } catch (error) {\\n
                throw new Error(\`Gmail API error: \${error.message}\`);\\n
              }\\n
            };

            Key points:
            - Use googleapis package when needed
            - Expect accessToken in inputs
            - Handle API responses and errors
            - Return useful data for next step",
            "requiresPackages": true,
            "suggestedIcon": "Mail",
            "suggestedTitle": "Gmail Message Fetcher"
        }

        3. For Simple HTTP Requests:
        {
            "readyForCode": true,
            "context": "Create an async function that fetches data from an API.
            Reference implementation pattern:

            export const code = async (inputs: { url: string; }) => {\\n
              try {\\n
                const response = await fetch(inputs.url);\\n
                if (!response.ok) {\\n
                  throw new Error(\`HTTP error! status: \${response.status}\`);\\n
                }\\n
                const data = await response.json();\\n
                return { data };\\n
              } catch (error) {\\n
                throw new Error(\`Request failed: \${error.message}\`);\\n
              }\\n
            };

            Key points:
            - Use native fetch
            - Simple error handling
            - Return response data
            - No external dependencies needed",
            "requiresPackages": false,
            "suggestedIcon": "Globe",
            "suggestedTitle": "HTTP Request Handler"
        }

        Remember:
        - This is ONE STEP in a flow, not a complete service
        - Each step should do one thing well
        - Inputs come from previous steps or flow connections
        - Outputs will be used by next steps
        - Keep implementation focused and simple
        - No need for complex authentication flows
        - Assume authentication is handled by the flow`

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
        context: `Create a TypeScript function following this pattern:

        export const code = async (inputs: Record<string, any>) => {
          try {
            // Implementation here
            return { result: 'success' };
          } catch (error) {
            throw new Error(\`Operation failed: \${error.message}\`);
          }
        };

        Key points:
        - Simple input/output contract
        - Proper error handling
        - Return useful data for next step`,
        requiresPackages: false,
        suggestedIcon: 'Code2',
        suggestedTitle: 'Code Implementation',
    }
} 