import { createOpenAI } from '@ai-sdk/openai'
import { DeepPartial, generateObject } from 'ai'
import { z } from 'zod'
import { system , AppSystemProp } from '@activepieces/server-shared'

export function getModel() {
    try {
        const apiKey = system.get(AppSystemProp.OPENAI_API_KEY)
        if (!apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        const openai = createOpenAI({
            apiKey,
        })
        return openai.chat('gpt-4')
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

        const result = await generateObject({
            model,
            system: `
            You are a TypeScript code generation expert for Node.js backend development.
            Your task is to:
            1. Generate TypeScript code based on the requirement
            2. List any required npm packages (only if sandbox mode is enabled)
            3. Define necessary input parameters
            
            CRITICAL REQUIREMENT:
            - You MUST ALWAYS name the exported function variable 'code'
            - The code MUST ALWAYS start with 'export const code ='
            - This naming is required for the system to work properly
            
            Environment Context:
            - Node.js backend only (no frontend frameworks)
            - Running in a sandbox/serverless environment
            - ${sandboxMode ? 'External packages are allowed' : 'Only Node.js native features are allowed'}
            
            Always follow these rules:
            - ALWAYS use 'export const code = ' as the function declaration
            - Code should be in TypeScript
            - Use async/await for asynchronous operations
            - Include type definitions for inputs
            - Make code reusable and modular
            - Follow best practices and clean code principles
            - Include proper error handling and timeouts
            - Consider sandbox environment limitations
            ${sandboxMode ? '' : '- Use only Node.js native modules (no external packages)'}
            
            Example of correct function naming:
            {
                "code": "export const code = async (inputs: { param: string }) => {
                    // implementation
                }"
            }

            For HTTP requests without sandbox mode, use this pattern:
            {
                "code": "export const code = async (inputs: { url: string, method?: string }) => {
                    try {
                        const https = require('https');
                        const url = new URL(inputs.url);
                        
                        return new Promise((resolve, reject) => {
                            const req = https.request({
                                hostname: url.hostname,
                                path: url.pathname + url.search,
                                method: inputs.method || 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                timeout: 5000
                            }, (res) => {
                                let data = '';
                                res.on('data', chunk => data += chunk);
                                res.on('end', () => {
                                    if (res.statusCode >= 200 && res.statusCode < 300) {
                                        resolve(JSON.parse(data));
                                    } else {
                                        reject(new Error(\`HTTP error! status: \${res.statusCode}\`));
                                    }
                                });
                            });
                            
                            req.on('error', (error) => reject(error));
                            req.on('timeout', () => {
                                req.destroy();
                                reject(new Error('Request timeout'));
                            });
                            
                            req.end();
                        });
                    } catch (error) {
                        throw new Error(\`Request failed: \${error.message}\`);
                    }
                }",
                "packages": [],
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
            `,
            schema: codeGenerationSchema,
            prompt: `
            Generate TypeScript code for this requirement:
            ${requirement}
            
            IMPORTANT: Remember to use 'export const code = ' as the function declaration.
            Remember: ${sandboxMode ? 'External packages are allowed' : 'Only Node.js native features are allowed'}
            Ensure the code is properly typed and includes all necessary input parameters.
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

        // added a small validation to check if the code starts with 'export const code =' - we can remove it if it's not requried 
        if (!result.object.code.trim().startsWith('export const code =')) {
            const fixedCode = `export const code = ${result.object.code.trim()}`
            return {
                ...result.object,
                code: fixedCode,
            }
        }

        return result.object
    }
    catch (error) {
        return {
            code: '',
            packages: [],
            inputs: [],
        }
    }
}
