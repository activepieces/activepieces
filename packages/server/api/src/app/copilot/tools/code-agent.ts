import { createOpenAI } from '@ai-sdk/openai'
import { DeepPartial, generateObject } from 'ai'
import { z } from 'zod'

export function getModel() {
    try {
        const openai = createOpenAI({
            apiKey:
              '------ API KEY HERE ------',
        })
        return openai.chat('gpt-4o')
    }
    catch (error) {
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

        const result = await generateObject({
            model,
            system: `
            You are a TypeScript code generation expert. Your task is to:
            1. Generate TypeScript code based on the requirement
            2. List any required npm packages
            3. Define necessary input parameters
            
            Always follow these rules:
            - Code should be in TypeScript
            - Use async/await for asynchronous operations
            - Include type definitions for inputs
            - Make code reusable and modular
            - Follow best practices and clean code principles
            - For HTTP requests, if no specific package is required, use the built-in 'node-fetch' package
            - When making HTTP requests, always include error handling and timeout
            
            For HTTP requests without a specific package requirement, use this pattern:
            {
                "code": "export const makeRequest = async (inputs: { url: string, method?: string }) => {
                    try {
                        const response = await fetch(inputs.url, {
                            method: inputs.method || 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: 5000
                        });
                        
                        if (!response.ok) {
                            throw new Error(\`HTTP error! status: \${response.status}\`);
                        }
                        
                        return await response.json();
                    } catch (error) {
                        throw new Error(\`Request failed: \${error.message}\`);
                    }
                }",
                "packages": ["node-fetch"],
                "inputs": [
                    {
                        "name": "url",
                        "type": "string",
                        "description": "The URL to make the request to"
                    },
                    {
                        "name": "method",
                        "type": "string",
                        "description": "HTTP method (GET, POST, etc.)"
                    }
                ]
            }
            
            Example format for other cases:
            {
                "code": "export const processData = async (inputs: { data: string[] }) => {
                    return inputs.data.map(item => item.toUpperCase());
                }",
                "packages": ["lodash", "date-fns"],
                "inputs": [
                    {
                        "name": "data",
                        "type": "string[]",
                        "description": "Array of strings to process"
                    }
                ]
            }
            `,
            schema: codeGenerationSchema,
            prompt: `
            Generate TypeScript code for this requirement:
            ${requirement}
            
            Ensure the code is properly typed and includes all necessary input parameters.
            If the requirement involves HTTP requests and no specific package is mentioned, use node-fetch.
            `,
            temperature: 0,
        })

        if (!result?.object) {
            return {
                code: '',
                packages: [],
                inputs: [],
            }
        }

        return {
            code: result.object.code,
            packages: result.object.packages || [],
            inputs: result.object.inputs || [],
        }
    }
    catch (error) {
        return {
            code: '',
            packages: [],
            inputs: [],
        }
    }
}
