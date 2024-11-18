import { AskCopilotCodeResponse, AskCopilotRequest } from '@activepieces/shared'
import OpenAI from 'openai'
import { generateCode } from './code-agent'

const perplexityApiKey =
  '------ API KEY HERE ------'

const openai = new OpenAI({
    apiKey: perplexityApiKey,
    baseURL: 'https://api.perplexity.ai',
})

export const codeGeneratorTool = {
    async generateCode(
        request: AskCopilotRequest,
    ): Promise<AskCopilotCodeResponse | null> {
        try {
            const prompt = `Search for code examples and implementation details for this requirement: "${request.prompt}". 
            Include information about commonly used npm packages and best practices for this type of implementation.`

            const response = await openai.chat.completions.create({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: `You are a code research expert. Search and provide detailed information about implementing the requested functionality.
                        Include:
                        - Common implementation patterns
                        - Recommended npm packages
                        - Best practices
                        - Code examples
                        Focus on TypeScript/JavaScript implementations.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            })

            const perplexityResponse = response.choices[0].message.content
            if (!perplexityResponse) {
                return null
            }

            
            const result = await generateCode(
                `${request.prompt}\n\nResearch findings:\n${perplexityResponse}`,
            )
            
            if (!result?.code) {
                return null
            }

        
            const dependencies: Record<string, string> = {}
            result.packages?.forEach((pkg) => {
                if (typeof pkg === 'string' && pkg.length > 0) {
                    dependencies[pkg] = '*'
                }
            })

            
            const inputs: Record<string, string> = {}
            result.inputs?.forEach((input) => {
                if (input?.name && input?.type) {
                    inputs[input.name] = input.type
                }
            })
    
            return {
                code: result.code,
                packageJson: {
                    dependencies,
                },
                inputs,
            }
        }
        catch (error) {
            return null
        }
    },
}