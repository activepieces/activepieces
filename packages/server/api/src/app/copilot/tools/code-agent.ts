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
            
            Simple Example:
            {
                "code": "export const code = async (inputs: { data: string }) => { return inputs.data.toUpperCase(); }",
                "packages": [],
                "inputs": [
                    {
                        "name": "data",
                        "type": "string",
                        "description": "Input string to process"
                    }
                ]
            }

            HTTP Example:
            {
                "code": "export const code = async (inputs: { url: string }) => { const response = await fetch(inputs.url); return response.json(); }",
                "packages": ["node-fetch"],
                "inputs": [
                    {
                        "name": "url",
                        "type": "string",
                        "description": "URL to fetch"
                    }
                ]
            }

            Email Example:
            {
                "code": "export const code = async (inputs: { to: string, subject: string, body: string }) => { const nodemailer = require('nodemailer'); /* rest of implementation */ }",
                "packages": ["nodemailer"],
                "inputs": [
                    {
                        "name": "to",
                        "type": "string",
                        "description": "Recipient email"
                    },
                    {
                        "name": "subject",
                        "type": "string",
                        "description": "Email subject"
                    },
                    {
                        "name": "body",
                        "type": "string",
                        "description": "Email content"
                    }
                ]
            }
            `,
            schema: codeGenerationSchema,
            prompt: `
            Generate TypeScript code for this requirement:
            ${requirement}
            
            IMPORTANT: 
            - Use 'export const code = ' as the function declaration
            - Keep the code simple and avoid complex string literals in the response JSON
            - Ensure proper JSON escaping for any special characters
            Remember: ${sandboxMode ? 'External packages are allowed' : 'Only Node.js native features are allowed'}
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

        // Verify and fix the code format if needed
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
        console.error('Code generation failed:', error)
        return {
            code: '',
            packages: [],
            inputs: [],
        }
    }
}
