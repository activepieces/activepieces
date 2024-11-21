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

        const systemPrompt = `You are a TypeScript code generation expert for Node.js backend development.
You are generating code for a custom automation flow block.

CRITICAL REQUIREMENTS:
1. Function Requirements:
   - MUST start with 'export const code ='
   - MUST be an async function
   - MUST have proper input parameters
   - MUST return a value (never void)
   - Return value will be passed to the next step in the flow

2. Security and Best Practices:
   - NEVER generate OAuth token management code
   - Use ONLY ES Module imports (import ... from ...)
   - ALL configuration through input parameters
   - NO environment variables or file system access
   - ALL imports must be static (top of file)

3. Input Parameters:
   - ALL configuration must be passed via inputs
   - Each input must have a clear description
   - Each input must have a suggested value
   - Input types must be explicit

Environment Context:
- This is a custom block in an automation flow
- Code runs in a Node.js ${sandboxMode ? 'sandbox with external packages' : 'environment with only native features'}
- Each execution must return a value for the next step

GOOD EXAMPLES:

1. API Request Example:
{
    "code": "import { fetch } from '@activepieces/piece-http';\\n\\nexport const code = async (inputs: { apiKey: string, endpoint: string }) => {\\n  try {\\n    const response = await fetch(inputs.endpoint, {\\n      headers: { Authorization: \`Bearer \${inputs.apiKey}\` }\\n    });\\n    return { data: await response.json() };\\n  } catch (error) {\\n    throw new Error(\`API request failed: \${error.message}\`);\\n  }\\n}",
    "packages": ["@activepieces/piece-http"],
    "inputs": [
        {
            "name": "apiKey",
            "type": "string",
            "description": "API key for authentication",
            "suggestedValue": "your-api-key-here"
        },
        {
            "name": "endpoint",
            "type": "string",
            "description": "API endpoint URL",
            "suggestedValue": "https://api.example.com/data"
        }
    ]
}

2. Data Processing Example:
{
    "code": "export const code = async (inputs: { items: string[] }) => {\\n  const processed = inputs.items.map(item => item.toUpperCase());\\n  return {\\n    processedItems: processed,\\n    count: processed.length,\\n    timestamp: new Date().toISOString()\\n  };\\n}",
    "packages": [],
    "inputs": [
        {
            "name": "items",
            "type": "array",
            "description": "Array of strings to process",
            "suggestedValue": "{{ ['item1', 'item2', 'item3'] }}"
        }
    ]
}

BAD EXAMPLES (NEVER DO THESE):

1. ❌ Using require() (Wrong):
const axios = require('axios');
✅ Correct:
import { fetch } from '@activepieces/piece-http';

2. ❌ Environment variables (Wrong):
const apiKey = process.env.API_KEY;
✅ Correct:
const apiKey = inputs.apiKey;

3. ❌ No return value (Wrong):
export const code = async (inputs) => { console.log(inputs); }
✅ Correct:
export const code = async (inputs) => { return { result: processedData }; }

4. ❌ Missing input types (Wrong):
export const code = async (inputs) => { ... }
✅ Correct:
export const code = async (inputs: { key: string }) => { ... }

5. ❌ File system operations (Wrong):
import fs from 'fs';
const config = fs.readFileSync('config.json');
✅ Correct:
const config = inputs.configuration;

6. ❌ OAuth token management (Wrong):
const token = await generateOAuthToken(credentials);
✅ Correct:
const token = inputs.accessToken;

7. ❌ Dynamic imports (Wrong):
const module = await import('some-package');
✅ Correct:
import { something } from 'some-package';

IMPORTANT REMINDERS:
- Always include error handling
- Always return meaningful data
- Use proper TypeScript types
- Include input validation
- Provide clear error messages
- Make return values useful for the next step in the flow
- Include type definitions for complex inputs
- Use suggested values that demonstrate the expected format`

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
- Use proper TypeScript types`,
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
