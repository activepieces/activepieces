import { AskCopilotCodeResponse, AskCopilotRequest } from '@activepieces/shared'
import OpenAI from 'openai'
import { DeepPartial } from 'ai'
import { generateCode, getModel } from './code-agent'
import { generatePlan, type PlanResponse } from './plan-agent'
import { system, AppSystemProp } from '@activepieces/server-shared'

function getPerplexityClient() {
    const apiKey = system.get(AppSystemProp.PERPLEXITY_API_KEY)
    const baseURL = system.get(AppSystemProp.PERPLEXITY_BASE_URL)

    if (!apiKey || !baseURL) {
        throw new Error('Perplexity API configuration missing')
    }

    return new OpenAI({
        apiKey,
        baseURL,
    })
}

async function searchWithPerplexity(query: string): Promise<string | null> {
    try {
        const openai = getPerplexityClient()
        
        const response = await openai.chat.completions.create({
            model: 'llama-3.1-sonar-small-128k-online',
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
                    content: query,
                },
            ],
        })

        return response.choices[0].message.content
    }
    catch (error) {
        console.error('Perplexity search failed:', error)
        return null
    }
}

interface SearchQuery {
    query: string;
    reason: string;
}

export const codeGeneratorTool = {
    async generateCode(
        request: AskCopilotRequest,
    ): Promise<AskCopilotCodeResponse | null> {
        try {
            const sandboxMode = request.sandboxMode ?? true
            
            let plan = await generatePlan(request.prompt, sandboxMode)
            
            if (plan.needsResearch && Array.isArray(plan.searchQueries) && plan.searchQueries.length > 0) {
                const searchResults = await Promise.all(
                    plan.searchQueries
                        .filter((query): query is SearchQuery => 
                            query !== null && 
                            query !== undefined && 
                            typeof query.query === 'string' &&
                            typeof query.reason === 'string'
                        )
                        .map(query => searchWithPerplexity(query.query))
                )
                
                const validResults = searchResults
                    .filter((result): result is string => result !== null)
                    .join('\n\n')

                plan = await generatePlan(request.prompt, sandboxMode, validResults)
            }

            if (plan.readyForCode && plan.context) {
                const result = await generateCode(plan.context, sandboxMode)
                
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
                    icon: plan.suggestedIcon || 'Code2',
                    title: plan.suggestedTitle || 'Code Implementation',
                }
            }

            return null
        }
        catch (error) {
            console.error(error)
            return null
        }
    },
}