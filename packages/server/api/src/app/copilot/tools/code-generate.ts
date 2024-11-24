import { AskCopilotCodeResponse, AskCopilotRequest, ExecutionMode } from '@activepieces/shared'
import OpenAI from 'openai'
import { generateCode } from './code-agent'
import { generatePlan } from './plan-agent'
import { system, AppSystemProp, SharedSystemProp } from '@activepieces/server-shared'

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

function createDefaultResponse(error?: string): AskCopilotCodeResponse {
    return {
        code: `export const code = async (inputs: Record<string, never>) => {
    throw new Error('${error || 'Failed to generate code. Please try again with a different prompt.'}');
    return { error: true };
}`,
        packageJson: {
            dependencies: {},
        },
        inputs: {},
        icon: 'AlertTriangle',
        title: 'Error: Code Generation Failed',
    }
}

export const codeGeneratorTool = {
    async generateCode(
        request: AskCopilotRequest,
    ): Promise<AskCopilotCodeResponse> {
        try {
            const sandboxMode = system.getOrThrow(SharedSystemProp.EXECUTION_MODE) !== ExecutionMode.UNSANDBOXED
            
            let plan = await generatePlan(request.prompt, sandboxMode)
            if (!plan) {
                return createDefaultResponse('Failed to generate plan')
            }
            
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
                if (!plan) {
                    return createDefaultResponse('Failed to generate plan after research')
                }
            }

            if (!plan.readyForCode || !plan.context) {
                return createDefaultResponse('Plan is not ready for code generation')
            }

            const result = await generateCode(plan.context, sandboxMode)
            if (!result?.code) {
                return createDefaultResponse('Code generation failed')
            }

            const dependencies: Record<string, string> = {}
            result.packages?.forEach((pkg) => {
                if (typeof pkg === 'string' && pkg.length > 0) {
                    dependencies[pkg] = '*'
                }
            })

            const inputs: Record<string, string> = {}
            result.inputs?.forEach((input) => {
                if (input?.name && input?.suggestedValue) {
                    inputs[input.name] = input.suggestedValue
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
        catch (error) {
            console.error('Code generation failed:', error)
            return createDefaultResponse(error instanceof Error ? error.message : 'Unknown error occurred')
        }
    },
}