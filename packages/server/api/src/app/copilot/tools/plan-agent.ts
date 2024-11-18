import { createOpenAI } from '@ai-sdk/openai'
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
            return {}
        }

        const systemPrompt = `
        You are an expert planning agent for Node.js backend development.
        Your role is to analyze requirements and create implementation plans.

        Key responsibilities:
        1. Analyze user requirements
        2. Determine research needs
        3. Create detailed implementation steps
        4. Suggest appropriate Lucide icon and title
        5. Consider package requirements

        Environment Context:
        - Node.js backend only (no frontend)
        - Sandbox/serverless environment
        - ${sandboxMode ? 'Can use external packages' : 'Must use only Node.js native features'}

        Planning Guidelines:
        - Break down complex tasks into steps
        - Consider error handling and security
        - Plan for proper input validation
        - Include type safety measures
        - Consider performance implications

        For the suggestedIcon, use Lucide icon names (https://lucide.dev/icons/):
        - For HTTP/API: 'Globe', 'Network', 'Cloud'
        - For files: 'File', 'FileText', 'Files'
        - For email: 'Mail', 'SendHorizontal'
        - For database: 'Database', 'Storage'
        - For authentication: 'Lock', 'Shield'
        - Default: 'Code2'

        Example Response:
        {
            "needsResearch": true,
            "searchQueries": [
                {
                    "query": "Node.js native email sending capabilities",
                    "reason": "Need to understand native email options"
                }
            ],
            "plan": [
                {
                    "step": 1,
                    "action": "Research email sending",
                    "details": "Investigate native Node.js options"
                }
            ],
            "readyForCode": false,
            "context": "",
            "requiresPackages": false,
            "suggestedIcon": "Mail",
            "suggestedTitle": "Email Dispatch System"
        }
        `

        const prompt = searchResults 
            ? `
                Original requirement: ${requirement}
                Search results: ${searchResults}
                Based on these results, create an updated plan.
                Remember: ${sandboxMode ? 'Can use external packages' : 'Must use only Node.js native features'}
            `
            : `
                Create a plan for: ${requirement}
                Remember: ${sandboxMode ? 'Can use external packages' : 'Must use only Node.js native features'}
            `

        const result = await generateObject({
            model,
            system: systemPrompt,
            schema: planSchema,
            prompt,
            temperature: 0,
        })

        return result.object || {
            needsResearch: false,
            searchQueries: [],
            plan: [],
            readyForCode: false,
            context: '',
            requiresPackages: false,
            suggestedIcon: 'Code2',
            suggestedTitle: 'Code Implementation',
        }
    }
    catch (error) {
        console.error('Plan generation failed:', error)
        return {
            needsResearch: false,
            searchQueries: [],
            plan: [],
            readyForCode: false,
            context: '',
            requiresPackages: false,
            suggestedIcon: 'Code2',
            suggestedTitle: 'Code Implementation',
        }
    }
} 